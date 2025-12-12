# 解决 libgpuf_c_sdk_v9.so 合并冲突

## 问题
Git 无法自动合并二进制文件 `libgpuf_c_sdk_v9.so`，因为：
- HEAD（当前分支）有旧版本或不同名称的文件
- main 分支有新的 `libgpuf_c_sdk_v9.so`

## 解决方案

### 方法 1：使用 main 分支的版本（推荐）
```bash
# 选择使用 main 分支的版本（新的 SDK v9）
git checkout --theirs android/app/src/main/jniLibs/arm64-v8a/libgpuf_c_sdk_v9.so

# 标记为已解决
git add android/app/src/main/jniLibs/arm64-v8a/libgpuf_c_sdk_v9.so
```

### 方法 2：使用当前分支的版本
```bash
# 选择使用当前分支的版本
git checkout --ours android/app/src/main/jniLibs/arm64-v8a/libgpuf_c_sdk_v9.so

# 标记为已解决
git add android/app/src/main/jniLibs/arm64-v8a/libgpuf_c_sdk_v9.so
```

### 方法 3：手动替换（如果上述方法不行）
```bash
# 1. 删除冲突标记的文件
rm android/app/src/main/jniLibs/arm64-v8a/libgpuf_c_sdk_v9.so

# 2. 从 main 分支获取新版本
git checkout main -- android/app/src/main/jniLibs/arm64-v8a/libgpuf_c_sdk_v9.so

# 3. 标记为已解决
git add android/app/src/main/jniLibs/arm64-v8a/libgpuf_c_sdk_v9.so
```

## 完成合并

解决所有冲突后：
```bash
# 检查状态
git status

# 提交合并
git commit -m "chore: resolve merge conflicts for gpuf SDK v9"
```

## 注意事项

- 二进制文件无法查看差异，需要手动选择使用哪个版本
- 建议使用 main 分支的版本（`--theirs`），因为这是新的 SDK v9
- 如果还有其他冲突文件，需要逐一解决

