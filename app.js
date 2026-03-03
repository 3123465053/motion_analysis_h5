document.addEventListener('DOMContentLoaded', () => {

    // ===================== CONFIG =====================
    const BASE_URL         = 'https://api.ai-face.ai';
    const API_URL          = BASE_URL + '/couple/video/analyze';
    const FACE_UPLOAD_URL  = BASE_URL + '/ai/file/saveFile/';          // 上传人脸图片
    const FACE_SUBMIT_URL  = BASE_URL + '/ai/face/fusionFaces';        // 提交换脸任务
    const FACE_RESULT_URL  = BASE_URL + '/ai/face/getAsyncJobResult/'; // 查询结果（拼接 requestId）
    const OSS_POLICY_URL      = 'http://myapi.ai-face.ai/api/v4/AiModule/GetPolicyToken'; // 获取OSS上传凭证
    const TEMPLATES_URL       = 'http://myapi.ai-face.ai/api/v4/AiModule/MergeVideoFace/GetTemplates'; // 获取换脸模板列表
    const TEMPLATES_STYLE_ID  = 14; // Face Swap 分类
    const LOGIN_URL        = BASE_URL + '/couple/user/thirdparty/login';
    const TOKEN_KEY        = 'couple-token';
    const DEVICE_ID_KEY    = 'h5-device-id';

    // 模板列表（动态从接口加载，格式：[{ id, video_url, cover_url }]）
    let templateList = [];

    const sceneTypes = [
        { title: '在家挥拍', subtitle: '适配客厅/卧室的轻量训练', desc: 'HOME', color: '#fff1b3' },
        { title: '个人练习', subtitle: '强化节奏与动作连贯性',    desc: 'SOLO', color: '#dff7f5' },
        { title: '亲子陪练', subtitle: '亲子互动，轻松入门',       desc: 'FAM',  color: '#e8f5e9' },
        { title: '双人对打', subtitle: '提升反应与对抗强度',       desc: 'DUO',  color: '#ffe9e9' }
    ];

    // ===================== DOM =====================
    const pageHome      = document.getElementById('page-home');
    const pageAnalysis  = document.getElementById('page-analysis');
    const pageMe        = document.getElementById('page-me');
    const pageFaceSwap  = document.getElementById('page-faceswap');
    const bottomNav     = document.getElementById('bottom-tab-bar');
    const sceneGrid     = document.getElementById('scene-grid');
    const videoInput    = document.getElementById('video-input');
    const facePhotoInput= document.getElementById('face-photo-input');

    // analysis
    const backBtn       = document.getElementById('back-btn');
    const videoCover    = document.getElementById('video-cover');
    const videoPlayer   = document.getElementById('video-player');
    const coverOverlay  = document.getElementById('cover-overlay');
    const loadingState  = document.getElementById('loading-state');
    const progressBar   = document.getElementById('progress-bar');
    const loadingTextEl = document.querySelector('.loading-text');
    const resultContent = document.getElementById('result-content');
    const emptyState    = document.getElementById('empty-state');

    // face swap
    const faceswapBackBtn   = document.getElementById('faceswap-back-btn');
    const tplVideo          = document.getElementById('faceswap-tpl-video');
    const uploadBox         = document.getElementById('faceswap-upload-box');
    const photoPreview      = document.getElementById('faceswap-photo-preview');
    const uploadPlaceholder = document.getElementById('faceswap-upload-placeholder');
    const submitBtn         = document.getElementById('faceswap-submit-btn');
    const progressEl        = document.getElementById('faceswap-progress');
    const progressBar2      = document.getElementById('faceswap-progress-bar');
    const progressText      = document.getElementById('faceswap-progress-text');
    const resultEl          = document.getElementById('faceswap-result');
    const resultVideo       = document.getElementById('faceswap-result-video');
    const errorEl           = document.getElementById('faceswap-error');
    const errorMsg          = document.getElementById('faceswap-error-msg');
    const resetBtn          = document.getElementById('faceswap-reset-btn');
    const downloadBtn       = document.getElementById('faceswap-download-btn');
    const retryBtn          = document.getElementById('faceswap-retry-btn');

    // ===================== STATE =====================
    let currentVideoFile      = null;
    let cancelTokenSource     = null;
    let currentTab            = 'home';
    let faceSwapTemplateIndex = 0;
    let facePhotoFile         = null;
    let faceSwapRequestId     = null;
    let faceSwapPollTimer     = null;
    let faceSwapResultUrl     = '';
    let fakeProgressTimer     = null;
    let fakeProgressVal       = 0;
    let isCanceled            = false;
    let retryCount            = 0;
    const FACESWAP_TEMPLATE_URLS = [
        'https://aimiaoying-shanghai.oss-cn-shanghai.aliyuncs.com/digitalperson/ai/video/video_00001-audio.mp4',
        'https://aimiaoying-shanghai.oss-cn-shanghai.aliyuncs.com/digitalperson/ai/video/video_00002-audio.mp4',
        'https://aimiaoying-shanghai.oss-cn-shanghai.aliyuncs.com/digitalperson/ai/video/video_00003-audio.mp4',
        'https://aimiaoying-shanghai.oss-cn-shanghai.aliyuncs.com/digitalperson/ai/video/video_00004-audio.mp4',
    ];

    // ===================== INIT =====================
    renderSceneGrid();
    bindFaceSwapCardHover();
    autoLogin();

    window.switchTab    = switchTab;
    window.onShootTap   = onShootTap;
    window.openFaceSwap = openFaceSwap;

    // ===================== AUTH =====================
    function getToken() { return localStorage.getItem('couple-token') || ''; }

    function getUserId() { return localStorage.getItem('h5-user-id') || 0; }

    // ai-face.ai 换脸接口: Authorization 传空 + client_source: app
    function faceApiHeaders() {
        return { 'Authorization': '', 'client_source': 'app' };
    }

    // 运动分析接口: couple-token
    function coupleTokenHeaders() {
        const t = getToken();
        return t ? { 'couple-token': t } : {};
    }

    function getOrCreateDeviceId() {
        let id = localStorage.getItem('h5-device-id');
        if (!id) {
            id = 'h5_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
            localStorage.setItem('h5-device-id', id);
        }
        return id;
    }

    async function autoLogin() {
        // 有 token 且 userId 有效时跳过，否则重新登录（保证 userId 不为 0）
        if (getToken() && getUserId() != 0) return;
        try {
            const res = await axios.post(LOGIN_URL, {
                oauthType: 'apple',
                headUrl: 'https://vediocnd.corpring.com/ai_avatar_url16.png',
                createdDevice: 3,
                appId: 'com.heyu.motionAnalysis',
                nickname: 'H5用户_' + Math.random().toString(36).slice(2, 6),
                appAccountToken: getOrCreateDeviceId()
            }, { timeout: 10000 });
            if (res.data && res.data.code === 200 && res.data.data) {
                const d = res.data.data;
                if (d.token) localStorage.setItem('couple-token', d.token);
                const uid = (d.userInfo && (d.userInfo.id || d.userInfo.userId || d.userInfo.user_id)) || d.id || 0;
                localStorage.setItem('h5-user-id', String(uid));
                console.log('[autoLogin] 登录成功, userId:', uid);
            }
        } catch(e) { console.warn('[autoLogin] 失败:', e.message); }
    }

    // ===================== TAB =====================
    function switchTab(tab) {
        if (tab === currentTab) return;
        currentTab = tab;
        if (tab === 'home') {
            pageHome.classList.add('active'); pageHome.classList.remove('hidden-tab');
            pageMe.classList.remove('tab-active'); pageMe.classList.add('hidden-tab');
        } else {
            pageHome.classList.remove('active'); pageHome.classList.add('hidden-tab');
            pageMe.classList.add('tab-active'); pageMe.classList.remove('hidden-tab');
        }
        document.getElementById('tab-home').classList.toggle('active', tab === 'home');
        document.getElementById('tab-me').classList.toggle('active',   tab === 'me');
    }
    function onShootTap() { videoInput.click(); }

    // ===================== SCENE GRID =====================
    function renderSceneGrid() {
        sceneGrid.innerHTML = '';
        sceneTypes.forEach(scene => {
            const card = document.createElement('div');
            card.className = 'scene-card';
            card.innerHTML =
                '<div class="card-text">' +
                  '<span class="card-title">' + scene.title + '</span>' +
                  '<span class="card-subtitle">' + scene.subtitle + '</span>' +
                '</div>' +
                '<div class="card-badge" style="background:' + scene.color + '">' + scene.desc + '</div>';
            card.addEventListener('click', () => videoInput.click());
            sceneGrid.appendChild(card);
        });
    }

    // ===================== VIDEO ANALYSIS =====================
    videoInput.addEventListener('change', e => {
        if (!e.target.files.length) return;
        const file = e.target.files[0];
        if (file.type.startsWith('video/')) { currentVideoFile = file; navigateToAnalysis(); }
        else alert('请选择有效的视频文件');
        videoInput.value = '';
    });

    function navigateToAnalysis() {
        resetAnalysisPage();
        videoPlayer.src = URL.createObjectURL(currentVideoFile);
        videoPlayer.style.display = 'block';
        videoPlayer.currentTime = 0.1;
        pageAnalysis.classList.remove('hidden');
        setTimeout(() => pageAnalysis.classList.add('active'), 10);
        bottomNav.style.display = 'none';
        startRealAnalysis();
    }

    backBtn.addEventListener('click', () => {
        if (cancelTokenSource) cancelTokenSource.cancel('back');
        videoPlayer.pause(); videoPlayer.src = ''; currentVideoFile = null;
        pageAnalysis.classList.remove('active');
        setTimeout(() => pageAnalysis.classList.add('hidden'), 300);
        bottomNav.style.display = 'flex';
    });

    videoCover.addEventListener('click', () => {
        if (videoPlayer.paused) { videoPlayer.play(); coverOverlay.style.display = 'none'; }
        else { videoPlayer.pause(); coverOverlay.style.display = 'flex'; }
    });
    videoPlayer.addEventListener('pause', () => { coverOverlay.style.display = 'flex'; });
    videoPlayer.addEventListener('play',  () => { coverOverlay.style.display = 'none'; });

    function resetAnalysisPage() {
        loadingState.classList.remove('hidden');
        resultContent.classList.add('hidden');
        emptyState.classList.add('hidden');
        progressBar.style.width = '0%';
        if (loadingTextEl) loadingTextEl.innerHTML = '准备上传... <span id="loading-percent">0%</span>';
        resultContent.innerHTML = '';
    }

    async function startRealAnalysis() {
        if (!currentVideoFile) return;
        const formData = new FormData();
        formData.append('video', currentVideoFile);
        formData.append('type', 'tennis');
        const CancelToken = axios.CancelToken;
        cancelTokenSource = CancelToken.source();

        let visualProgress = 0, uploadProgress = 0;
        const iv = setInterval(() => {
            if (visualProgress < uploadProgress) visualProgress += Math.max(1, (uploadProgress - visualProgress) / 10);
            else if (uploadProgress === 100 && visualProgress < 99) visualProgress += 0.5;
            if (visualProgress > 99) visualProgress = 99;
            const v = Math.floor(visualProgress);
            const el = document.getElementById('loading-percent');
            if (el) el.textContent = v + '%';
            progressBar.style.width = v + '%';
            if (uploadProgress === 100 && loadingTextEl) loadingTextEl.textContent = 'AI 正在分析动作...';
        }, 50);

        try {
            const res = await axios.post(API_URL, formData, {
                headers: { ...coupleTokenHeaders() },
                cancelToken: cancelTokenSource.token,
                timeout: 300000,
                onUploadProgress: e => { uploadProgress = Math.round(e.loaded * 100 / e.total); }
            });
            clearInterval(iv); progressBar.style.width = '100%';
            if (res.data && res.data.code === 200) {
                const d = res.data.data;
                let content = typeof d === 'string' ? d : (d && (d.content || d.result || d.markdown)) || res.data.message || '';
                setTimeout(() => renderResult(content || '解析后内容为空'), 300);
            } else {
                throw new Error((res.data && res.data.message) || '服务器返回错误');
            }
        } catch (err) {
            clearInterval(iv);
            if (!axios.isCancel(err)) {
                loadingState.classList.add('hidden');
                emptyState.classList.remove('hidden');
                emptyState.innerHTML = '<div class="empty-text" style="color:red">分析失败<br><span style="font-size:14px;color:#666">' + (err.message||'网络错误') + '</span></div><button style="margin-top:20px;padding:10px 20px;background:var(--primary-color);border:none;border-radius:100px;font-weight:bold;cursor:pointer" onclick="location.reload()">重试</button>';
            }
        }
    }

    function renderResult(md) {
        if (md == null) md = '分析结果为空';
        if (typeof md !== 'string') { try { md = JSON.stringify(md, null, 2); } catch(e) { md = String(md); } }
        loadingState.classList.add('hidden');
        resultContent.classList.remove('hidden');
        try { resultContent.innerHTML = marked.parse(md); } catch(e) { resultContent.innerText = md; }
    }

    // ===================== FACE SWAP =====================
    // 动态加载模板列表（对应 Flutter MergeVideoFaceGetTemplates）
    async function loadFaceSwapTemplates() {
        try {
            const res = await axios.get(TEMPLATES_URL, {
                params: { style_id: TEMPLATES_STYLE_ID },
                headers: { ...faceApiHeaders() },
                timeout: 10000
            });
            if (res.data && res.data.code === 200 && res.data.data && res.data.data.list) {
                templateList = res.data.data.list;
                console.log('[templates] 加载成功，共', templateList.length, '个模板, 前两个:', JSON.stringify(templateList.slice(0,2)));
                // 同步更新换脸卡片的封面/视频预览
                updateFaceSwapCards();
            } else {
                console.warn('[templates] 加载失败:', JSON.stringify(res.data));
            }
        } catch(e) {
            console.error('[templates] 请求异常:', e.message);
        }
    }

    function updateFaceSwapCards() {
        const cards = document.querySelectorAll('.faceswap-card');
        cards.forEach((card, i) => {
            const tpl = templateList[i];
            if (!tpl) return;
            const v = card.querySelector('.faceswap-preview');
            if (v) { v.src = tpl.video_url; v.load(); }
            const img = card.querySelector('img:not(.faceswap-preview)');
            if (img) img.src = tpl.cover_url;
        });
    }

    function openFaceSwap(index) {
        faceSwapTemplateIndex = index;
        faceSwapResetState();
        isCanceled = false;
        retryCount = 0;
        tplVideo.src = FACESWAP_TEMPLATE_URLS[index] || FACESWAP_TEMPLATE_URLS[0];
        tplVideo.play().catch(() => {});
        pageFaceSwap.classList.remove('hidden');
        setTimeout(() => pageFaceSwap.classList.add('active'), 10);
        bottomNav.style.display = 'none';
    }

    faceswapBackBtn.addEventListener('click', () => {
        isCanceled = true;
        clearFaceSwapPoll();
        tplVideo.pause(); tplVideo.src = '';
        pageFaceSwap.classList.remove('active');
        setTimeout(() => pageFaceSwap.classList.add('hidden'), 300);
        bottomNav.style.display = 'flex';
    });

    uploadBox.addEventListener('click', () => {
        if (!resultEl.classList.contains('hidden')) return;
        facePhotoInput.click();
    });

    facePhotoInput.addEventListener('change', e => {
        if (!e.target.files.length) return;
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) { showToast('请选择 JPG 或 PNG 图片'); return; }
        facePhotoFile = file;
        photoPreview.src = URL.createObjectURL(file);
        photoPreview.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
        facePhotoInput.value = '';
    });

    // 提交按钮 —— 对照 generatePhoto 函数
    submitBtn.addEventListener('click', async () => {
        if (!facePhotoFile) { showToast('请先上传人脸照片'); return; }
        if (submitBtn.classList.contains('disabled')) return;

        submitBtn.classList.add('disabled');
        submitBtn.textContent = '上传图片中...';
        progressEl.classList.remove('hidden');
        progressText.textContent = '正在上传人脸图片...';
        errorEl.classList.add('hidden');
        resultEl.classList.add('hidden');
        fakeProgressStart();

        try {
            // Step1: 先获取 OSS Policy Token，再直传到阿里云 OSS，拿到图片 URL
            // 对应 Flutter uploadImgOss → uploadOss 流程
            const userId = getUserId();
            console.log('[faceSwap] Step1: 开始上传图片到OSS, userId:', userId, '| file:', facePhotoFile.name, facePhotoFile.size, 'bytes');
            const imageUrl = await uploadImgToOss(facePhotoFile);
            console.log('[faceSwap] Step1: OSS上传成功, imageUrl:', imageUrl);
            progressText.textContent = 'AI 合成中，请稍候...';
            submitBtn.textContent = '生成中...';

            // Step2: 提交换脸任务（对应 generatePhoto，type 传 ""）
            const submitPayload = {
                videoUrl:   FACESWAP_TEMPLATE_URLS[faceSwapTemplateIndex] || FACESWAP_TEMPLATE_URLS[0],
                imageUrl:   imageUrl,
                templateId: 0,  // 自定义模式固定传 0
                userId:     userId,
                type:       ''
            };
            console.log('[faceSwap] Step2: 提交换脸任务', JSON.stringify(submitPayload));
            const submitRes = await axios.post(FACE_SUBMIT_URL, submitPayload, {
                headers: faceApiHeaders(),
                timeout: 30000
            });
            console.log('[faceSwap] Step2: 任务提交响应', JSON.stringify(submitRes.data));
            if (submitRes.data && submitRes.data.code === 200 && submitRes.data.data) {
                faceSwapRequestId = submitRes.data.data; // 对应 requestId
                console.log('[faceSwap] Step3: 开始轮询结果, requestId:', faceSwapRequestId);
                retryCount = 0;
                // Step3: 轮询结果（对应 photoTrain）
                photoTrain(faceSwapRequestId);
            } else {
                throw new Error((submitRes.data && submitRes.data.message) || '任务提交失败');
            }
        } catch (err) {
            showFaceSwapError(err.message || '网络请求失败，请重试');
        }
    });

    // 对照 photoTrain 递归查询
    async function photoTrain(requestId) {
        if (isCanceled || !requestId) { return; }
        console.log('[photoTrain] 开始查询, requestId:', requestId, '| retryCount:', retryCount);
        try {
            const url = FACE_RESULT_URL + requestId;
            console.log('[photoTrain] GET', url);
            const res = await axios.get(url, {
                headers: faceApiHeaders(),
                timeout: 10000
            });
            if (isCanceled) return;

            console.log('[photoTrain] 响应 status:', res.status, '| data:', JSON.stringify(res.data));

            if (!res.data || res.data.code !== 200) {
                console.error('[photoTrain] 接口异常, code:', res.data && res.data.code, '| message:', res.data && res.data.message);
                showFaceSwapError('查询失败：' + (res.data && res.data.message || '服务器返回异常'));
                return;
            }

            const d = res.data.data;
            const status = d ? d.status : null;
            console.log('[photoTrain] 任务状态:', status, '| data.data:', JSON.stringify(d));

            if (status === 'QUEUING' || status === 'PROCESSING') {
                console.log('[photoTrain] 排队/处理中，2秒后继续轮询...');
                faceSwapPollTimer = setTimeout(() => photoTrain(requestId), 2000);
            } else if (status === 'PROCESS_SUCCESS' && d.fileUrl) {
                console.log('[photoTrain] 合成成功！fileUrl:', d.fileUrl);
                showFaceSwapResult(d.fileUrl);
            } else {
                console.warn('[photoTrain] 未知状态或无 fileUrl, status:', status, '| d:', JSON.stringify(d));
                if (retryCount < 1) {
                    retryCount++;
                    console.log('[photoTrain] 重试第', retryCount, '次...');
                    faceSwapPollTimer = setTimeout(() => photoTrain(requestId), 2000);
                } else {
                    showFaceSwapError('合成失败，请重试（status: ' + status + '）');
                }
            }
        } catch(e) {
            console.error('[photoTrain] 请求异常:', e.message, e);
            if (!isCanceled) {
                if (retryCount < 1) {
                    retryCount++;
                    console.log('[photoTrain] 异常后重试第', retryCount, '次...');
                    faceSwapPollTimer = setTimeout(() => photoTrain(requestId), 2000);
                } else {
                    showFaceSwapError('网络异常：' + e.message);
                }
            }
        }
    }

    function clearFaceSwapPoll() {
        if (faceSwapPollTimer) { clearTimeout(faceSwapPollTimer); faceSwapPollTimer = null; }
        fakeProgressStop();
    }

    function fakeProgressStart() {
        fakeProgressVal = 0; progressBar2.style.width = '0%';
        fakeProgressTimer = setInterval(() => {
            fakeProgressVal += (90 - fakeProgressVal) * 0.015;
            if (fakeProgressVal > 90) fakeProgressVal = 90;
            progressBar2.style.width = fakeProgressVal.toFixed(1) + '%';
        }, 300);
    }
    function fakeProgressStop() {
        if (fakeProgressTimer) { clearInterval(fakeProgressTimer); fakeProgressTimer = null; }
    }

    function showFaceSwapResult(url) {
        faceSwapResultUrl = url;
        fakeProgressStop(); progressBar2.style.width = '100%';
        setTimeout(() => {
            progressEl.classList.add('hidden');
            resultEl.classList.remove('hidden');
            resultVideo.src = url; resultVideo.load();
        }, 400);
        submitBtn.textContent = '已生成';
    }

    function showFaceSwapError(msg) {
        fakeProgressStop();
        progressEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        errorMsg.textContent = msg;
        submitBtn.classList.remove('disabled');
        submitBtn.textContent = '开始生成';
    }

    function faceSwapResetState() {
        isCanceled = false; retryCount = 0;
        clearFaceSwapPoll();
        facePhotoFile = null; faceSwapRequestId = null; faceSwapResultUrl = '';
        photoPreview.src = ''; photoPreview.style.display = 'none';
        uploadPlaceholder.style.display = 'flex';
        submitBtn.classList.remove('disabled'); submitBtn.textContent = '开始生成';
        progressEl.classList.add('hidden');
        resultEl.classList.add('hidden');
        errorEl.classList.add('hidden');
        progressBar2.style.width = '0%';
    }

    resetBtn.addEventListener('click', faceSwapResetState);
    retryBtn.addEventListener('click', faceSwapResetState);
    downloadBtn.addEventListener('click', () => {
        if (!faceSwapResultUrl) return;
        const a = document.createElement('a');
        a.href = faceSwapResultUrl; a.download = 'faceswap_result.mp4'; a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    });

    function bindFaceSwapCardHover() {
        document.querySelectorAll('.faceswap-card').forEach(card => {
            const v = card.querySelector('.faceswap-preview');
            card.addEventListener('mouseenter', () => v && v.play().catch(() => {}));
            card.addEventListener('mouseleave', () => { if (v) { v.pause(); v.currentTime = 0; } });
        });
    }

    // 备用模板视频（当接口未返回时使用）
    const TEMPLATE_VIDEOS_FALLBACK = [
        'https://cdn-video.gzheyu.com.cn/digitalperson/ai/video/202504/24/7ed7f560-f839-4a97-ac60-81c2c0b29bde.mp4',
        'https://cdn-video.gzheyu.com.cn/digitalperson/ai/video/202507/02/fdb35466-a25e-4bf9-aeda-27fbeeef358e.mp4'
    ];

    // 将任意可访问的视频 URL 下载后上传到 OSS，返回 OSS 地址
    // 对应 Flutter uploadVideoOss → uploadOss 流程
    async function uploadVideoToOss(videoUrl) {
        console.log('[uploadVideoToOss] 开始下载模板视频:', videoUrl);
        // 1. fetch 视频为 Blob
        const fetchRes = await fetch(videoUrl);
        if (!fetchRes.ok) throw new Error('下载模板视频失败: ' + fetchRes.status);
        const blob = await fetchRes.blob();
        // 从 URL 提取文件名
        const urlName = videoUrl.split('/').pop() || ('template_' + Date.now() + '.mp4');
        const file = new File([blob], urlName, { type: blob.type || 'video/mp4' });
        console.log('[uploadVideoToOss] 下载完成，size:', file.size, '开始上传OSS');

        // 2. 获取 OSS Policy Token
        const policyRes = await axios.get(OSS_POLICY_URL, {
            params: { file_name: urlName },
            headers: { ...faceApiHeaders() },
            timeout: 15000
        });
        if (!policyRes.data || policyRes.data.code !== 200 || !policyRes.data.data) {
            throw new Error('获取OSS凭证失败: ' + (policyRes.data && policyRes.data.message));
        }
        const token = policyRes.data.data;

        // 3. 上传到 OSS
        const ossForm = new FormData();
        ossForm.append('key',            token.dir);
        ossForm.append('policy',         token.policy);
        ossForm.append('OSSAccessKeyId', token.accessid);
        ossForm.append('signature',      token.signature);
        ossForm.append('file',           file, urlName);
        const ossRes = await axios.post(token.host, ossForm, { timeout: 120000 });
        if (ossRes.status !== 204 && ossRes.status !== 200) {
            throw new Error('视频OSS上传失败，状态码: ' + ossRes.status);
        }
        return token.host + '/' + token.dir;
    }

    // 上传图片到阿里云 OSS，返回可访问的图片 URL
    // 对应 Flutter uploadImgOss + uploadOss 流程
    async function uploadImgToOss(file) {
        const name = file.name || ('face_' + Date.now() + '.jpg');

        // 1. 获取 OSS Policy Token（对应 Flutter GET GetPolicyToken?file_name=xxx）
        const policyRes = await axios.get(OSS_POLICY_URL, {
            params: { file_name: name },
            headers: { ...faceApiHeaders() },
            timeout: 15000
        });
        if (!policyRes.data || policyRes.data.code !== 200 || !policyRes.data.data) {
            throw new Error((policyRes.data && policyRes.data.message) || '获取OSS凭证失败');
        }
        const token = policyRes.data.data;
        // token 字段：host, dir, policy, accessid, signature

        // 2. 构造 FormData，直传 OSS（对应 Flutter formData.fields + files）
        const ossForm = new FormData();
        ossForm.append('key',          token.dir);
        ossForm.append('policy',       token.policy);
        ossForm.append('OSSAccessKeyId', token.accessid);
        ossForm.append('signature',    token.signature);
        ossForm.append('file',         file, name);

        // 3. POST 到 OSS host（对应 Flutter dio.post(ossPolicyToken["data"]["host"], data: formData)）
        const ossRes = await axios.post(token.host, ossForm, {
            timeout: 60000
        });
        // OSS 直传成功返回 204
        if (ossRes.status !== 204 && ossRes.status !== 200) {
            throw new Error('OSS 上传失败，状态码：' + ossRes.status);
        }
        // 返回完整图片 URL（对应 Flutter "${host}/${dir}"）
        return token.host + '/' + token.dir;
    }

    // 文件转 base64 DataURL
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('图片读取失败'));
            reader.readAsDataURL(file);
        });
    }

    // ===================== TOAST =====================
    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

});
