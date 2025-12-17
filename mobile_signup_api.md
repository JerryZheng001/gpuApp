# 手机号注册 API 接口文档

本文档详细说明手机号注册接口的使用方法。

## 目录

- [手机号注册 API 接口文档](#手机号注册-api-接口文档)
  - [目录](#目录)
  - [接口概述](#接口概述)
  - [接口详情](#接口详情)
    - [1. 手机号注册/登录](#1-手机号注册登录)
  - [通用说明](#通用说明)
    - [认证方式](#认证方式)
    - [验证码获取](#验证码获取)
    - [验证码有效期](#验证码有效期)
    - [用户状态说明](#用户状态说明)
    - [邀请码说明](#邀请码说明)
    - [错误码说明](#错误码说明)
  - [请求/响应示例](#请求响应示例)
    - [新用户注册示例](#新用户注册示例)
    - [已存在用户登录示例](#已存在用户登录示例)
    - [带邀请码注册示例](#带邀请码注册示例)
    - [错误响应示例](#错误响应示例)
  - [注意事项](#注意事项)

---

## 接口概述

手机号注册接口支持通过手机号和短信验证码进行注册或登录。如果手机号已存在，则自动登录；如果不存在，则创建新用户并自动登录。

**前置条件**：调用此接口前，需要先调用短信验证码发送接口获取验证码。

---

## 接口详情

### 1. 手机号注册/登录

**接口说明**：通过手机号和短信验证码进行注册或登录。如果手机号已存在，则直接登录；如果不存在，则创建新用户并自动登录。注册成功后会自动设置用户会话（Session）。

**请求信息**：
- **URL**: `/api/mobile/signup`
- **Method**: `POST`
- **认证**: 无需认证（公开接口）
- **Content-Type**: `application/json`
- **限流**: 受全局 API 限流保护

**请求参数**：
```json
{
  "phone_number": "13800138000",
  "code": "123456",
  "aff_code": "ABCD"
}
```

**参数说明**：
| 参数名         | 类型   | 必填 | 说明                                                          |
| -------------- | ------ | ---- | ------------------------------------------------------------- |
| `phone_number` | string | 是   | 手机号码                                                      |
| `code`         | string | 是   | 短信验证码（6位数字）                                         |
| `aff_code`     | string | 否   | 邀请码（4位字符串），如果提供，系统会处理邀请关系和新用户奖励 |

**成功响应** (200 OK)：
```json
{
  "success": true,
  "message": "",
  "data": {
    "id": 123,
    "username": "13800138000",
    "display_name": "13800138000",
    "role": 1,
    "status": 1,
    "group": "default",
    "email": "13800138000@mobile.com",
    "phone_number": "13800138000",
    "phone_number_verified": true
  }
}
```

**响应字段说明**：
| 字段名                       | 类型    | 说明                                |
| ---------------------------- | ------- | ----------------------------------- |
| `success`                    | boolean | 请求是否成功                        |
| `message`                    | string  | 响应消息（成功时为空字符串）        |
| `data`                       | object  | 用户信息对象                        |
| `data.id`                    | integer | 用户ID                              |
| `data.username`              | string  | 用户名（默认为手机号）              |
| `data.display_name`          | string  | 显示名称（默认为手机号）            |
| `data.role`                  | integer | 用户角色（1=普通用户）              |
| `data.status`                | integer | 用户状态（1=启用）                  |
| `data.group`                 | string  | 用户分组（默认为"default"）         |
| `data.email`                 | string  | 邮箱（自动生成：手机号@mobile.com） |
| `data.phone_number`          | string  | 手机号码                            |
| `data.phone_number_verified` | boolean | 手机号是否已验证（true）            |

**错误响应** (200 OK)：

1. **请求参数错误**：
```json
{
  "message": "Key: 'mobileSignupRequest.PhoneNumber' Error:Field validation for 'PhoneNumber' failed on the 'required' tag",
  "success": false
}
```

2. **验证码不存在或已过期**：
```json
{
  "message": "验证码不存在或已过期",
  "success": false
}
```

3. **验证码错误**：
```json
{
  "message": "验证码错误",
  "success": false
}
```

4. **用户创建失败**：
```json
{
  "message": "具体错误信息",
  "success": false
}
```

5. **会话保存失败**：
```json
{
  "message": "无法保存会话信息，请重试",
  "success": false
}
```

---

## 通用说明

### 认证方式

此接口为公开接口，无需携带认证 Token。注册/登录成功后，系统会自动设置 Session，后续请求可通过 Session 进行身份验证。

### 验证码获取

在调用此接口前，需要先调用短信验证码发送接口：
- **URL**: `/api/sms/sendverifyCode`
- **Method**: `POST`
- **请求参数**: `{"phone_num": "13800138000"}`

### 验证码有效期

- 验证码有效期为 **5分钟**
- 验证码使用后会自动删除，防止重复使用
- 每个手机号在同一时间段只能有一个有效验证码

### 用户状态说明

- **新用户注册**：如果手机号不存在，系统会创建新用户，并自动处理新用户活动奖励
- **已存在用户登录**：如果手机号已存在，系统会直接使用该用户账号登录，不会创建新用户
- **用户信息**：新用户的用户名、显示名称、邮箱都会自动设置为手机号相关值

### 邀请码说明

- **邀请码格式**：4位字符串（如 "ABCD"）
- **邀请码处理**：
  - 如果提供了有效的邀请码，系统会建立邀请关系
  - 邀请人和被邀请人都会获得相应的活动奖励（如果活动开启）
  - 如果邀请码无效或不存在，注册流程仍会继续，但不会建立邀请关系
- **活动奖励**：无论是否有邀请码，新用户都会获得注册奖励（如果活动开启）

### 错误码说明

| 错误信息             | 说明                                | 解决方案           |
| -------------------- | ----------------------------------- | ------------------ |
| 验证码不存在或已过期 | Redis 中找不到验证码或验证码已过期  | 重新发送验证码     |
| 验证码错误           | 输入的验证码与 Redis 中存储的不一致 | 检查验证码是否正确 |
| 无法保存会话信息     | Session 保存失败                    | 重试请求           |

---

## 请求/响应示例

### 新用户注册示例

**步骤1：发送验证码**
```bash
curl -X POST "http://localhost:3000/api/sms/sendverifyCode" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_num": "13800138000"
  }'
```

**步骤2：注册/登录**
```bash
curl -X POST "http://localhost:3000/api/mobile/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "13800138000",
    "code": "123456"
  }'
```

**成功响应**：
```json
{
  "success": true,
  "message": "",
  "data": {
    "id": 123,
    "username": "13800138000",
    "display_name": "13800138000",
    "role": 1,
    "status": 1,
    "group": "default",
    "email": "13800138000@mobile.com",
    "phone_number": "13800138000",
    "phone_number_verified": true
  }
}
```

### 已存在用户登录示例

如果手机号已存在，系统会直接登录，不会创建新用户：

```bash
curl -X POST "http://localhost:3000/api/mobile/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "13800138000",
    "code": "123456"
  }'
```

响应格式与注册成功相同，返回已存在的用户信息。

### 带邀请码注册示例

```bash
curl -X POST "http://localhost:3000/api/mobile/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "13800138000",
    "code": "123456",
    "aff_code": "ABCD"
  }'
```

如果邀请码有效，系统会：
1. 建立邀请关系（设置 `inviter_id`）
2. 为邀请人和被邀请人发放活动奖励（如果活动开启）
3. 更新邀请人的邀请统计信息

### 错误响应示例

**验证码过期**：
```bash
curl -X POST "http://localhost:3000/api/mobile/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "13800138000",
    "code": "123456"
  }'
```

**响应**：
```json
{
  "message": "验证码不存在或已过期",
  "success": false
}
```

**验证码错误**：
```bash
curl -X POST "http://localhost:3000/api/mobile/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "13800138000",
    "code": "000000"
  }'
```

**响应**：
```json
{
  "message": "验证码错误",
  "success": false
}
```

**缺少必填参数**：
```bash
curl -X POST "http://localhost:3000/api/mobile/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "13800138000"
  }'
```

**响应**：
```json
{
  "message": "Key: 'mobileSignupRequest.Code' Error:Field validation for 'Code' failed on the 'required' tag",
  "success": false
}
```

---

## 注意事项

1. **验证码安全**：
   - 验证码使用后会自动删除，不能重复使用
   - 验证码有效期为 5 分钟，过期后需要重新获取
   - 验证码存储在 Redis 中，格式为：`sms_verification_code:{phone_number}`

2. **用户创建**：
   - 新用户的用户名、显示名称、邮箱都会自动设置为手机号相关值
   - 新用户默认角色为普通用户（`role = 1`）
   - 新用户默认状态为启用（`status = 1`）
   - 新用户默认分组为 "default"

3. **Session 管理**：
   - 注册/登录成功后，系统会自动设置 Session
   - Session 包含以下信息：`id`, `username`, `role`, `status`, `group`
   - 后续请求可以通过 Session 进行身份验证

4. **邀请码处理**：
   - 邀请码是可选的，不提供也能正常注册
   - 如果邀请码无效，注册流程仍会继续，但不会建立邀请关系
   - 邀请奖励的处理不会阻塞注册流程，即使处理失败也不会影响用户注册

5. **活动奖励**：
   - 新用户注册时会自动处理活动奖励（如果活动开启）
   - 如果提供了邀请码，邀请人和被邀请人都会获得奖励
   - 奖励处理失败不会阻止注册流程，只会记录错误日志

6. **错误处理**：
   - 所有错误响应都返回 HTTP 200 状态码
   - 通过 `success` 字段判断请求是否成功
   - 错误信息在 `message` 字段中

7. **限流保护**：
   - 此接口受全局 API 限流保护
   - 建议客户端实现适当的重试机制和错误处理

---

> **更新日期**：2025.01.XX
