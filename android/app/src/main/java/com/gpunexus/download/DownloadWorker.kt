package com.gpunexus.download

import android.content.Context
import android.os.Build
import android.util.Log
import androidx.work.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.InetAddress
import java.net.UnknownHostException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class DownloadWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    private val downloadDao = DownloadDatabase.getInstance(context).downloadDao()
    private val client = OkHttpClient.Builder()
        .dns(CustomDnsResolver())
        .addInterceptor(ProgressInterceptor())
        .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()
    private var lastProgressUpdate = 0L
    private var currentCall: Call? = null

    init {
        Log.d(TAG, "Initializing DownloadWorker")
    }

    private fun handleStopped() {
        Log.d(TAG, "Worker stopped, cancelling any ongoing network request")
        currentCall?.cancel()
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val downloadId = inputData.getString(KEY_DOWNLOAD_ID) ?: return@withContext Result.failure()
            Log.d(TAG, "Starting download work for ID: $downloadId")

            if (isStopped) {
                Log.d(TAG, "Work was cancelled before starting for ID: $downloadId")
                handleStopped()
                downloadDao.updateStatus(downloadId, DownloadStatus.CANCELLED, "Download cancelled")
                return@withContext Result.failure()
            }

            val progressInterval = inputData.getLong(KEY_PROGRESS_INTERVAL, DEFAULT_PROGRESS_INTERVAL)
            Log.d(TAG, "Progress update interval: $progressInterval ms")

            val download = downloadDao.getDownload(downloadId) ?: return@withContext Result.failure()
            Log.d(TAG, "Retrieved download info: $download")

            if (download.status == DownloadStatus.PAUSED) {
                Log.d(TAG, "Download is paused, returning retry for ID: $downloadId")
                return@withContext Result.retry()
            }

            val file = File(download.destination)
            Log.d(TAG, "Download destination: ${file.absolutePath}")
            
            // Check if file size and database are in sync
            if (file.exists() && file.length() > 0) {
                // If file exists but size doesn't match database, update database
                if (file.length() != download.downloadedBytes) {
                    Log.d(TAG, "File size (${file.length()}) doesn't match database (${download.downloadedBytes}). Updating database.")
                    downloadDao.updateProgress(downloadId, file.length(), download.totalBytes, download.status)
                    // Reload download info after update
                    val updatedDownload = downloadDao.getDownload(downloadId)
                    if (updatedDownload != null) {
                        Log.d(TAG, "Updated download info: $updatedDownload")
                    }
                }
            }
            
            val request = Request.Builder()
                .url(download.url)
                .apply {
                    if (file.exists() && file.length() > 0) {
                        val range = "bytes=${file.length()}-"
                        Log.d(TAG, "Resuming download from byte ${file.length()}")
                        addHeader("Range", range)
                    }
                    
                    // Add authorization header if token is available
                    download.authToken?.let { token ->
                        Log.d(TAG, "Adding Authorization header for authenticated download")
                        addHeader("Authorization", "Bearer $token")
                    }
                }
                .build()

            Log.d(TAG, "Updating status to RUNNING for ID: $downloadId")
            downloadDao.updateStatus(downloadId, DownloadStatus.RUNNING)

            Log.d(TAG, "Executing network request for ID: $downloadId")
            val response = suspendCoroutine { continuation ->
                val call = client.newCall(request)
                currentCall = call  // Store the call reference
                call.enqueue(object : Callback {
                    override fun onFailure(call: Call, e: IOException) {
                        if (call.isCanceled()) {
                            Log.d(TAG, "Network request was cancelled for ID: $downloadId")
                        } else {
                            Log.e(TAG, "Network request failed for ID: $downloadId", e)
                        }
                        continuation.resumeWithException(e)
                    }

                    override fun onResponse(call: Call, response: Response) {
                        Log.d(TAG, "Received response for ID: $downloadId, code: ${response.code}")
                        continuation.resume(response)
                    }
                })
            }
            currentCall = null  // Clear the reference after completion

            if (file.exists() && file.length() > 0 && response.code == 200) {
                Log.w(TAG, "Server ignored range request, returning full file. Restarting download from beginning.")
                if (file.exists()) {
                    Log.d(TAG, "Deleting partial file to restart download: ${file.absolutePath}")
                    file.delete()
                }
            } else if (!response.isSuccessful) {
                when (response.code) {
                    416 -> {
                        Log.e(TAG, "Server rejected the range request for ID: $downloadId")
                        
                        if (file.exists()) {
                            Log.d(TAG, "Deleting invalid partial file: ${file.absolutePath}")
                            file.delete()
                        }
                        
                        downloadDao.updateStatus(
                            downloadId,
                            DownloadStatus.FAILED,
                            "Download failed: The partial download was invalid or the file on server has changed"
                        )
                        
                        return@withContext Result.failure()
                    }
                    in 400..499 -> {
                        val error = "Client error: ${response.code}"
                        Log.e(TAG, error)
                        downloadDao.updateStatus(downloadId, DownloadStatus.FAILED, error)
                        return@withContext Result.failure()
                    }
                    in 500..599 -> {
                        val error = "Server error: ${response.code}"
                        Log.e(TAG, error)
                        downloadDao.updateStatus(downloadId, DownloadStatus.FAILED, error)
                        return@withContext Result.retry()
                    }
                    else -> {
                        val error = "Unexpected response: ${response.code}"
                        Log.e(TAG, error)
                        downloadDao.updateStatus(downloadId, DownloadStatus.FAILED, error)
                        return@withContext Result.failure()
                    }
                }
            }

            response.body?.let { body ->
                // Get content length from response
                val contentLength = body.contentLength()
                Log.d(TAG, "Content length from response: $contentLength bytes for ID: $downloadId")
                
                // Get existing bytes written
                var bytesWritten = if (file.exists()) file.length() else 0
                Log.d(TAG, "Existing bytes written: $bytesWritten for ID: $downloadId")
                
                // Calculate total expected size based on response code
                val totalBytes = when (response.code) {
                    206 -> {
                        // For partial content (206), the content-length is just the remaining bytes
                        // So add existing bytes to get total size
                        val total = bytesWritten + contentLength
                        Log.d(TAG, "Partial content (206): Total size = $bytesWritten + $contentLength = $total bytes")
                        total
                    }
                    200 -> {
                        // For full content (200), use the content length as total size
                        Log.d(TAG, "Full content (200): Total size = $contentLength bytes")
                        contentLength
                    }
                    else -> {
                        // For other responses, use the larger of content length or existing total
                        val total = maxOf(contentLength, download.totalBytes)
                        Log.d(TAG, "Other response (${response.code}): Using total size = $total bytes")
                        total
                    }
                }
                
                // Update database with correct progress information
                downloadDao.updateProgress(downloadId, bytesWritten, totalBytes, DownloadStatus.RUNNING)
                Log.d(TAG, "Updated database: $bytesWritten/$totalBytes bytes (${(bytesWritten.toFloat() / totalBytes * 100).toInt()}%) for ID: $downloadId")

                // Determine if we should append to the file
                val appendMode = file.exists() && response.code == 206
                Log.d(TAG, "Opening file in ${if (appendMode) "append" else "overwrite"} mode")
                
                FileOutputStream(file, appendMode).buffered().use { output ->
                    body.byteStream().buffered().use { input ->
                        val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
                        var bytes = input.read(buffer)
                        
                        while (bytes >= 0) {
                            if (isStopped) {
                                Log.d(TAG, "Download cancelled during transfer for ID: $downloadId")
                                downloadDao.updateStatus(downloadId, DownloadStatus.CANCELLED, "Download cancelled")
                                if (file.exists()) {
                                    file.delete()
                                    Log.d(TAG, "Deleted partial download file: ${file.absolutePath}")
                                }
                                return@withContext Result.failure()
                            }

                            val currentDownload = downloadDao.getDownload(downloadId)
                            if (currentDownload?.status == DownloadStatus.PAUSED) {
                                Log.d(TAG, "Download paused during transfer for ID: $downloadId")
                                return@withContext Result.retry()
                            }

                            output.write(buffer, 0, bytes)
                            bytesWritten += bytes

                            val currentTime = System.currentTimeMillis()
                            if (currentTime - lastProgressUpdate >= progressInterval) {
                                val progress = workDataOf(
                                    KEY_PROGRESS to bytesWritten,
                                    KEY_TOTAL to totalBytes
                                )
                                Log.d(TAG, "Progress: $bytesWritten/$totalBytes bytes for ID: $downloadId")
                                setProgress(progress)
                                downloadDao.updateProgress(downloadId, bytesWritten, totalBytes, DownloadStatus.RUNNING)
                                lastProgressUpdate = currentTime
                            }
                            
                            bytes = input.read(buffer)
                        }
                    }
                }

                Log.d(TAG, "Download completed successfully for ID: $downloadId")
                downloadDao.updateProgress(downloadId, bytesWritten, totalBytes, DownloadStatus.COMPLETED)
                return@withContext Result.success()
            }

            Log.e(TAG, "No response body for ID: $downloadId")
            return@withContext Result.failure()
        } catch (e: Exception) {
            Log.e(TAG, "Download failed", e)
            val downloadId = inputData.getString(KEY_DOWNLOAD_ID)
            downloadId?.let {
                Log.e(TAG, "Updating status to FAILED for ID: $it")
                downloadDao.updateStatus(it, DownloadStatus.FAILED, e.message)
            }
            return@withContext Result.failure()
        }
    }

    companion object {
        private const val TAG = "DownloadWorker"
        const val KEY_DOWNLOAD_ID = "download_id"
        const val KEY_PROGRESS = "progress"
        const val KEY_TOTAL = "total"
        const val KEY_PROGRESS_INTERVAL = "progress_interval"
        const val DEFAULT_PROGRESS_INTERVAL = 1000L // 1 second default

        fun createWorkRequest(downloadId: String, progressInterval: Long = DEFAULT_PROGRESS_INTERVAL): OneTimeWorkRequest {
            Log.d(TAG, "Creating work request for download ID: $downloadId with progress interval: $progressInterval ms")
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(androidx.work.NetworkType.CONNECTED)
                .build()

            return OneTimeWorkRequestBuilder<DownloadWorker>()
                .setConstraints(constraints)
                .setInputData(workDataOf(
                    KEY_DOWNLOAD_ID to downloadId,
                    KEY_PROGRESS_INTERVAL to progressInterval
                ))
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    WorkRequest.MIN_BACKOFF_MILLIS,
                    java.util.concurrent.TimeUnit.MILLISECONDS
                )
                .build()
        }
    }
}

/**
 * Custom DNS resolver with aggressive retry and manual DNS resolution
 * This helps with DNS resolution issues, especially for ModelScope domains in China
 * 
 * Uses multiple strategies:
 * 1. System DNS with retries
 * 2. Manual InetAddress resolution (bypasses OkHttp's DNS)
 * 3. Multiple DNS servers fallback
 */
class CustomDnsResolver : Dns {
    companion object {
        private const val TAG = "CustomDnsResolver"
        private const val MAX_RETRIES = 5
        private const val INITIAL_RETRY_DELAY_MS = 200L
        private const val MAX_RETRY_DELAY_MS = 2000L
        
        // Known ModelScope IP addresses (may need periodic updates)
        // These are fallback IPs if DNS fails completely
        private val MODEL_SCOPE_IPS: Map<String, List<String>> = mapOf(
            "www.modelscope.cn" to listOf<String>(
                // Add known IPs here if available
                // "123.456.789.0" // Example format
            ),
            "modelscope.cn" to listOf<String>(
                // Add known IPs here if available
            )
        )
    }
    
    override fun lookup(hostname: String): List<InetAddress> {
        Log.d(TAG, "🔍 Attempting to resolve hostname: $hostname")
        
        // Strategy 1: Try system DNS with retries
        var lastException: UnknownHostException? = null
        
        for (attempt in 1..MAX_RETRIES) {
            try {
                Log.d(TAG, "DNS resolution attempt $attempt/$MAX_RETRIES for $hostname")
                
                // Try system DNS first
                val addresses = Dns.SYSTEM.lookup(hostname)
                
                if (addresses.isNotEmpty()) {
                    val ipAddresses = addresses.joinToString(", ") { addr: InetAddress -> addr.hostAddress }
                    Log.d(TAG, "✅ Successfully resolved $hostname to: $ipAddresses (attempt $attempt)")
                    return addresses
                } else {
                    Log.w(TAG, "DNS lookup returned empty list for $hostname (attempt $attempt)")
                }
            } catch (e: UnknownHostException) {
                lastException = e
                val errorMsg = e.message ?: "Unknown error"
                Log.w(TAG, "DNS resolution failed for $hostname (attempt $attempt/$MAX_RETRIES): $errorMsg")
                
                // Exponential backoff
                if (attempt < MAX_RETRIES) {
                    val delay = minOf(
                        INITIAL_RETRY_DELAY_MS * (1 shl (attempt - 1)),
                        MAX_RETRY_DELAY_MS
                    )
                    Log.d(TAG, "Waiting ${delay}ms before retry...")
                    try {
                        Thread.sleep(delay)
                    } catch (ie: InterruptedException) {
                        Thread.currentThread().interrupt()
                        Log.w(TAG, "DNS retry interrupted")
                        break
                    }
                }
            }
        }
        
        // Strategy 2: Try manual InetAddress resolution (bypasses OkHttp DNS)
        // This uses Java's InetAddress which may use different DNS resolution
        Log.d(TAG, "System DNS failed, trying manual InetAddress resolution...")
        try {
            // Force DNS lookup with longer timeout
            val addresses = InetAddress.getAllByName(hostname).toList()
            if (addresses.isNotEmpty()) {
                val ipAddresses = addresses.joinToString(", ") { addr: InetAddress -> addr.hostAddress }
                Log.d(TAG, "✅ Manual resolution successful: $hostname -> $ipAddresses")
                return addresses
            }
        } catch (e: UnknownHostException) {
            Log.w(TAG, "Manual InetAddress resolution also failed: ${e.message}")
            
            // Check if running on emulator
            val isEmulator = Build.FINGERPRINT.startsWith("generic") ||
                            Build.FINGERPRINT.startsWith("unknown") ||
                            Build.MODEL.contains("google_sdk") ||
                            Build.MODEL.contains("Emulator") ||
                            Build.MODEL.contains("Android SDK") ||
                            Build.MANUFACTURER.contains("Genymotion") ||
                            (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")) ||
                            "google_sdk" == Build.PRODUCT
            
            if (isEmulator) {
                Log.e(TAG, "⚠️ Running on emulator - DNS issues are common on emulators")
                Log.e(TAG, "Recommendation: Test on a real device or configure emulator DNS")
                Log.e(TAG, "Emulator DNS fix: Settings > WiFi > Long press > Modify > Advanced > DNS 1: 8.8.8.8")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Manual resolution error: ${e.message}")
        }
        
        // Strategy 3: Try known IP addresses (if available)
        MODEL_SCOPE_IPS[hostname]?.let { knownIPs: List<String> ->
            if (knownIPs.isNotEmpty()) {
                Log.d(TAG, "Trying known IP addresses for $hostname...")
                val addresses: List<InetAddress> = knownIPs.mapNotNull { ip: String ->
                    try {
                        InetAddress.getByName(ip)
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to create InetAddress from IP $ip: ${e.message}")
                        null
                    }
                }
                if (addresses.isNotEmpty()) {
                    val ipAddresses = addresses.joinToString(", ") { addr: InetAddress -> addr.hostAddress }
                    Log.d(TAG, "✅ Using known IP addresses: $ipAddresses")
                    return addresses
                }
            }
        }
        
        // All strategies failed
        Log.e(TAG, "❌ Failed to resolve $hostname after all strategies")
        Log.e(TAG, "Troubleshooting tips:")
        Log.e(TAG, "1. Check device DNS: Settings > WiFi > Advanced > DNS")
        Log.e(TAG, "2. Try DNS: 114.114.114.114 or 223.5.5.5")
        Log.e(TAG, "3. Check if using emulator (may have DNS issues)")
        Log.e(TAG, "4. Try on real device instead of emulator")
        Log.e(TAG, "5. Check network connectivity")
        
        throw lastException ?: UnknownHostException("Unable to resolve host \"$hostname\": No address associated with hostname")
    }
}

class ProgressInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalResponse = chain.proceed(chain.request())
        val originalBody = originalResponse.body
        
        return originalResponse.newBuilder()
            .body(if (originalBody != null) ProgressResponseBody(originalBody) else null)
            .build()
    }
} 