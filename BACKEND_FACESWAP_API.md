# 换脸功能 — 后端接口实现说明

H5 前端已就绪，后端需新增以下两个接口代理阿里云视频换脸能力。

---

## 阿里云配置

| 项目 | 值 |
|------|-----|
| Endpoint | `videoenhan.cn-shanghai.aliyuncs.com` |
| Action（提交） | `MergeVideoFace` |
| Action（查询） | `GetAsyncJobResult` |
| API Version | `2020-03-20` |
| 所需凭证 | AccessKeyId + AccessKeySecret（后端配置，不可暴露到前端） |

---

## 接口一：提交换脸任务

**H5 调用：**
```
POST https://api.ai-face.ai/couple/faceswap/submit
Headers: couple-token: <用户token>
Body (multipart/form-data):
  photo    : 用户人脸图片文件（JPG/PNG）
  videoUrl : 模板视频地址（字符串）
```

**后端处理：**
1. 验证 couple-token（鉴权）
2. 将 `photo` 上传到**上海地域 OSS**，拿到可访问的 OSS URL（`referenceUrl`）
3. 调用阿里云 `MergeVideoFace`：
   ```
   POST https://videoenhan.cn-shanghai.aliyuncs.com/
   Params:
     Action        = MergeVideoFace
     VideoURL      = <videoUrl>（模板视频，需是可访问URL）
     ReferenceURL  = <referenceUrl>（上传后的OSS地址）
     AddWatermark  = true
     WatermarkType = CN
   使用 AccessKeyId + AccessKeySecret 做 RPC 签名
   ```
4. 阿里返回 `RequestId`（即 JobId）
5. 后端返回给 H5：

```json
{
  "code": 200,
  "data": { "jobId": "<阿里返回的RequestId>" }
}
```

---

## 接口二：查询换脸结果

**H5 调用：**
```
GET https://api.ai-face.ai/couple/faceswap/result?jobId=xxx
Headers: couple-token: <用户token>
```

**后端处理：**
1. 验证 couple-token
2. 调用阿里云 `GetAsyncJobResult`：
   ```
   GET https://videoenhan.cn-shanghai.aliyuncs.com/
   Params:
     Action  = GetAsyncJobResult
     JobId   = <jobId>
   使用 AccessKeyId + AccessKeySecret 做 RPC 签名
   ```
3. 根据阿里返回状态，返回给 H5：

```json
// 处理中
{ "code": 200, "data": { "status": "processing" } }

// 成功
{ "code": 200, "data": { "status": "success", "videoUrl": "<结果视频URL>" } }

// 失败
{ "code": 200, "data": { "status": "failed", "message": "失败原因" } }
```

---

## 阿里云 RPC 签名流程（后端参考）

```
1. 构造参数：Action + Version + Format=JSON + SignatureMethod=HMAC-SHA1
             + SignatureNonce=随机字符串 + Timestamp=UTC时间 + AccessKeyId
2. 参数按字典序排列，URL encode 后拼接成 QueryString
3. StringToSign = "POST&%2F&" + urlencode(QueryString)
4. Signature = Base64(HMAC-SHA1(AccessKeySecret + "&", StringToSign))
5. 加入 Signature 参数后发起请求
```

推荐使用阿里云官方 SDK（Java/Node/Python 均有）自动处理签名：
- NPM: `@alicloud/pop-core`
- Maven: `com.aliyun:aliyun-java-sdk-videoenhan`

---

## 注意事项

- 模板视频 URL（cdn-video.gzheyu.com.cn）**不在上海 OSS**，需后端下载后转存到上海 OSS，或直接用 URL 传入（阿里支持可访问的 HTTP URL）
- 结果视频 URL 有效期 **30 分钟**，建议后端收到结果后立即转存到自己的 OSS
- 视频时长不超过 300 秒，大小不超过 120MB
