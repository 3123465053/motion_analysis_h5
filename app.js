document.addEventListener('DOMContentLoaded', () => {

    // ===================== CONFIG =====================
    const BASE_URL         = 'https://api.ai-face.ai';
    const API_URL          = 'https://api.douring.cn/app/movement/video/analyze';
    const FACE_UPLOAD_URL  = BASE_URL + '/ai/file/saveFile/';          // 上传人脸图片
    const FACE_SUBMIT_URL  = BASE_URL + '/ai/face/fusionFaces';        // 提交换脸任务
    const FACE_RESULT_URL  = BASE_URL + '/ai/face/getAsyncJobResult/'; // 查询结果（拼接 requestId）
    const OSS_POLICY_URL      = 'http://myapi.ai-face.ai/api/v4/AiModule/GetPolicyToken'; // 获取OSS上传凭证
    const TEMPLATES_URL       = 'http://myapi.ai-face.ai/api/v4/AiModule/MergeVideoFace/GetTemplates'; // 获取换脸模板列表
    const TEMPLATES_STYLE_ID  = 14; // Face Swap 分类
    const LOGIN_URL        = BASE_URL + '/couple/user/thirdparty/login';
    const SEND_CODE_URL    = BASE_URL + '/couple/user/email/send-code';
    const TOKEN_KEY        = 'couple-token';
    const DEVICE_ID_KEY    = 'h5-device-id';
    const USER_EMAIL_KEY   = 'h5-user-email';
    const USER_NICK_KEY    = 'h5-user-nickname';
    const LOGIN_TYPE_KEY   = 'h5-login-type';

    // 模板列表（动态从接口加载，格式：[{ id, video_url, cover_url }]）
    let templateList = [];

    // i18n 快捷引用
    const t = window.i18n.t;

    function getSceneTypes() {
        return [
            { title: t('sceneHome'), subtitle: t('sceneHomeSub'), desc: 'HOME', color: '#fff1b3' },
            { title: t('sceneSolo'), subtitle: t('sceneSoloSub'), desc: 'SOLO', color: '#dff7f5' },
            { title: t('sceneFam'),  subtitle: t('sceneFamSub'),  desc: 'FAM',  color: '#e8f5e9' },
            { title: t('sceneDuo'),  subtitle: t('sceneDuoSub'),  desc: 'DUO',  color: '#ffe9e9' }
        ];
    }

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
    // 先检测语言，再渲染 UI
    console.log('[app] 开始初始化，调用 detectLanguage...');
    window.i18n.detectLanguage().then(function() {
        console.log('[app] 语言检测完成, lang:', window.i18n.getLang(), '| type:', window.i18n.getAnalysisType());
        window.i18n.applyI18n();  // 替换所有 data-i18n 静态文本
        renderSceneGrid();         // 场景卡片需要动态生成
        // 替换 banner 视频
        var bannerVideo = document.getElementById('banner-video');
        if (bannerVideo) {
            var src = window.i18n.getBannerVideo();
            console.log('[app] 切换 banner 视频:', src);
            bannerVideo.src = src;
            bannerVideo.load();
            bannerVideo.play().catch(function() {});
        }
        console.log('[app] UI 渲染完成');
    });
    bindFaceSwapCardHover();
    autoLogin();
    bindLoginUI();
    refreshProfileUI();
    bindWaterUI();
    bindPlanUI();
    bindTutorialUI();

    window.switchTab         = switchTab;
    window.toggleBannerSound = toggleBannerSound;
    window.toggleBannerPlay  = toggleBannerPlay;
    window.showToast         = showToast;
    window.onProfileTap      = onProfileTap;
    window.openVipPage       = openVipPage;
    window.onVipPlanTap      = onVipPlanTap;
    window.onVipPayTap       = onVipPayTap;
    window.openTutorialPage  = openTutorialPage;
    window.openWaterPage     = openWaterPage;
    window.openPlanPage      = openPlanPage;
    window.switchPlanTab     = switchPlanTab;
    window.togglePlan        = togglePlan;
    window.deletePlan        = deletePlan;
    window.closePlanModal       = closePlanModal;
    window.savePlan             = savePlan;
    window.closeFeaturePage     = closeFeaturePage;
    window.closeVipSuccessModal = closeVipSuccessModal;
    window.onVipCancelTap       = onVipCancelTap;

    // ===== BANNER CONTROLS =====
    let bannerPlayOverlayTimer = null;

    function toggleBannerPlay() {
        const video   = document.getElementById('banner-video');
        const overlay = document.getElementById('banner-play-overlay');
        const icon    = document.getElementById('banner-play-icon');
        if (!video) return;
        if (video.paused) {
            video.play().catch(() => {});
            icon.textContent = 'pause';
        } else {
            video.pause();
            icon.textContent = 'play_arrow';
        }
        // 短暂显示图标后淡出
        overlay.style.opacity = '1';
        clearTimeout(bannerPlayOverlayTimer);
        bannerPlayOverlayTimer = setTimeout(() => { overlay.style.opacity = '0'; }, 800);
    }

    function toggleBannerSound() {
        const video = document.getElementById('banner-video');
        const icon  = document.getElementById('banner-sound-icon');
        if (!video) return;
        video.muted = !video.muted;
        icon.textContent = video.muted ? 'volume_off' : 'volume_up';
        if (!video.muted) video.play().catch(() => {});
    }
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
    function onShootTap() {
        if (!isLoggedIn()) { openLoginModal(); return; }
        if (!isVipMember()) { showToast(t('vipRequired')); openVipPage(); return; }
        videoInput.click();
    }

    // ===================== SCENE GRID =====================
    function renderSceneGrid() {
        sceneGrid.innerHTML = '';
        getSceneTypes().forEach(scene => {
            const card = document.createElement('div');
            card.className = 'scene-card';
            card.innerHTML =
                '<div class="card-text">' +
                  '<span class="card-title">' + scene.title + '</span>' +
                  '<span class="card-subtitle">' + scene.subtitle + '</span>' +
                '</div>' +
                '<div class="card-badge" style="background:' + scene.color + '">' + scene.desc + '</div>';
            card.addEventListener('click', () => {
                if (!isLoggedIn()) { openLoginModal(); return; }
                if (!isVipMember()) { showToast(t('vipRequired')); openVipPage(); return; }
                videoInput.click();
            });
            sceneGrid.appendChild(card);
        });
    }

    // ===================== VIDEO ANALYSIS =====================
    videoInput.addEventListener('change', e => {
        if (!e.target.files.length) return;
        const file = e.target.files[0];
        if (file.type.startsWith('video/')) { currentVideoFile = file; navigateToAnalysis(); }
        else alert(t('invalidVideo'));
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
        if (loadingTextEl) loadingTextEl.innerHTML = t('preparing') + ' <span id="loading-percent">0%</span>';
        resultContent.innerHTML = '';
    }

    async function startRealAnalysis() {
        if (!currentVideoFile) return;
        const formData = new FormData();
        formData.append('video', currentVideoFile);
        formData.append('type', window.i18n.getAnalysisType());
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
            if (uploadProgress === 100 && loadingTextEl) loadingTextEl.textContent = t('aiAnalyzingAction');
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
                setTimeout(() => renderResult(content || t('emptyContent')), 300);
            } else {
                throw new Error((res.data && res.data.message) || t('serverError'));
            }
        } catch (err) {
            clearInterval(iv);
            if (!axios.isCancel(err)) {
                loadingState.classList.add('hidden');
                emptyState.classList.remove('hidden');
                emptyState.innerHTML = '<div class="empty-text" style="color:red">' + t('analysisFailed') + '<br><span style="font-size:14px;color:#666">' + (err.message||t('networkError')) + '</span></div><button style="margin-top:20px;padding:10px 20px;background:var(--primary-color);border:none;border-radius:100px;font-weight:bold;cursor:pointer" onclick="location.reload()">' + t('retryBtn') + '</button>';
            }
        }
    }

    function renderResult(md) {
        if (md == null) md = t('resultEmpty');
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
        if (!file.type.startsWith('image/')) { showToast(t('selectImage')); return; }
        facePhotoFile = file;
        photoPreview.src = URL.createObjectURL(file);
        photoPreview.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
        facePhotoInput.value = '';
    });

    // 提交按钮 —— 对照 generatePhoto 函数
    submitBtn.addEventListener('click', async () => {
        if (!facePhotoFile) { showToast(t('uploadFaceFirst')); return; }
        if (submitBtn.classList.contains('disabled')) return;

        submitBtn.classList.add('disabled');
        submitBtn.textContent = t('uploadingImage');
        progressEl.classList.remove('hidden');
        progressText.textContent = t('uploadingFace');
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
            progressText.textContent = t('synthesizing');
            submitBtn.textContent = t('generating');

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
                throw new Error((submitRes.data && submitRes.data.message) || t('submitFailed'));
            }
        } catch (err) {
            showFaceSwapError(err.message || t('networkRequestFailed'));
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
                showFaceSwapError(t('queryFailed') + (res.data && res.data.message || t('serverError')));
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
                    showFaceSwapError(t('synthesisFailed') + '（status: ' + status + '）');
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
                    showFaceSwapError(t('networkException') + e.message);
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
        submitBtn.textContent = t('generated');
    }

    function showFaceSwapError(msg) {
        fakeProgressStop();
        progressEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        errorMsg.textContent = msg;
        submitBtn.classList.remove('disabled');
        submitBtn.textContent = t('startGenerate');
    }

    function faceSwapResetState() {
        isCanceled = false; retryCount = 0;
        clearFaceSwapPoll();
        facePhotoFile = null; faceSwapRequestId = null; faceSwapResultUrl = '';
        photoPreview.src = ''; photoPreview.style.display = 'none';
        uploadPlaceholder.style.display = 'flex';
        submitBtn.classList.remove('disabled'); submitBtn.textContent = t('startGenerate');
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

    // ===================== EMAIL LOGIN =====================
    function isLoggedIn() {
        return !!localStorage.getItem(USER_EMAIL_KEY) && localStorage.getItem(LOGIN_TYPE_KEY) === 'email';
    }

    function refreshProfileUI() {
        const nameEl   = document.getElementById('me-profile-name');
        const subEl    = document.getElementById('me-profile-sub');
        const iconEl   = document.getElementById('me-profile-avatar-icon');
        const imgEl    = document.getElementById('me-profile-avatar-img');
        if (!nameEl) return;
        if (isLoggedIn()) {
            const email    = localStorage.getItem(USER_EMAIL_KEY) || '';
            const nickname = localStorage.getItem(USER_NICK_KEY) || email.split('@')[0];
            // 已登录时移除 data-i18n，避免 applyI18n 覆盖用户数据
            nameEl.removeAttribute('data-i18n');
            subEl.removeAttribute('data-i18n');
            nameEl.textContent = nickname;
            subEl.textContent  = email;
            if (iconEl) iconEl.textContent = 'person';
        } else {
            nameEl.setAttribute('data-i18n', 'tapToLogin');
            subEl.setAttribute('data-i18n', 'loginHint');
            nameEl.textContent = t('tapToLogin');
            subEl.textContent  = t('loginHint');
            if (iconEl) iconEl.textContent = 'person';
            if (imgEl) { imgEl.src = ''; imgEl.style.display = 'none'; }
        }
    }

    function onProfileTap() {
        if (isLoggedIn()) {
            document.getElementById('logout-mask').classList.remove('hidden');
        } else {
            openLoginModal();
        }
    }

    function openLoginModal() {
        const mask = document.getElementById('login-mask');
        const err  = document.getElementById('login-error');
        const btn  = document.getElementById('login-submit-btn');
        err.classList.add('hidden'); err.textContent = '';
        btn.classList.remove('disabled');
        btn.textContent = t('loginBtn');
        document.getElementById('login-email').value = '';
        document.getElementById('login-code').value  = '';
        mask.classList.remove('hidden');
        setTimeout(() => { document.getElementById('login-email').focus(); }, 100);
    }

    function closeLoginModal() {
        document.getElementById('login-mask').classList.add('hidden');
    }

    function bindLoginUI() {
        const mask      = document.getElementById('login-mask');
        const closeBtn  = document.getElementById('login-close-btn');
        const codeInput = document.getElementById('login-code');
        const sendBtn   = document.getElementById('login-send-code-btn');
        const submit    = document.getElementById('login-submit-btn');

        closeBtn.addEventListener('click', closeLoginModal);
        mask.addEventListener('click', e => { if (e.target === mask) closeLoginModal(); });

        sendBtn.addEventListener('click', handleSendCode);
        submit.addEventListener('click', handleEmailLogin);
        codeInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleEmailLogin(); });

        // 退出登录
        const logoutMask   = document.getElementById('logout-mask');
        const logoutCancel = document.getElementById('logout-cancel-btn');
        const logoutOk     = document.getElementById('logout-ok-btn');
        logoutCancel.addEventListener('click', () => logoutMask.classList.add('hidden'));
        logoutMask.addEventListener('click', e => { if (e.target === logoutMask) logoutMask.classList.add('hidden'); });
        logoutOk.addEventListener('click', () => {
            localStorage.removeItem(USER_EMAIL_KEY);
            localStorage.removeItem(USER_NICK_KEY);
            localStorage.removeItem(LOGIN_TYPE_KEY);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.setItem('h5-user-id', '0');
            logoutMask.classList.add('hidden');
            refreshProfileUI();
            showToast(t('logoutSuccess'));
            autoLogin();
        });

        // VIP 页返回
        const vipBack = document.getElementById('vip-back-btn');
        if (vipBack) vipBack.addEventListener('click', closeVipPage);
    }

    async function handleSendCode() {
        const emailEl = document.getElementById('login-email');
        const errEl   = document.getElementById('login-error');
        const sendBtn = document.getElementById('login-send-code-btn');
        const email   = (emailEl.value || '').trim();

        errEl.classList.add('hidden');

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errEl.textContent = t('loginEmailInvalid');
            errEl.classList.remove('hidden');
            return;
        }

        sendBtn.classList.add('disabled');
        sendBtn.textContent = t('sendCodeLoading');

        try {
            const res = await axios.post(SEND_CODE_URL, {
                email: email,
                appId: 'com.tennis.h5'
            }, { timeout: 15000, validateStatus: () => true });

            if (res.data && res.data.code === 200) {
                let countdown = 60;
                const tick = () => {
                    sendBtn.textContent = t('sendCodeCooldown').replace('{s}', countdown);
                    if (--countdown < 0) {
                        sendBtn.classList.remove('disabled');
                        sendBtn.textContent = t('sendCode');
                    } else {
                        setTimeout(tick, 1000);
                    }
                };
                tick();
                document.getElementById('login-code').focus();
            } else {
                sendBtn.classList.remove('disabled');
                sendBtn.textContent = t('sendCode');
                errEl.textContent = t('sendCodeFailed');
                errEl.classList.remove('hidden');
            }
        } catch (e) {
            console.warn('[sendCode] failed:', e.message);
            sendBtn.classList.remove('disabled');
            sendBtn.textContent = t('sendCode');
            errEl.textContent = t('sendCodeFailed');
            errEl.classList.remove('hidden');
        }
    }

    async function handleEmailLogin() {
        const emailEl = document.getElementById('login-email');
        const codeEl  = document.getElementById('login-code');
        const errEl   = document.getElementById('login-error');
        const btn     = document.getElementById('login-submit-btn');
        const email   = (emailEl.value || '').trim();
        const code    = (codeEl.value || '').trim();

        errEl.classList.add('hidden');

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errEl.textContent = t('loginEmailInvalid');
            errEl.classList.remove('hidden');
            return;
        }
        if (!code) {
            errEl.textContent = t('loginCodeInvalid');
            errEl.classList.remove('hidden');
            return;
        }

        btn.classList.add('disabled');
        btn.textContent = t('loginLoading');

        try {
            const res = await axios.post(LOGIN_URL, {
                oauthType: 'email',
                email: email,
                code: code,
                appId: 'com.tennis.h5',
                createdDevice: 3,
                appAccountToken: getOrCreateDeviceId()
            }, { timeout: 15000, validateStatus: () => true });

            if (res.data && res.data.code === 200 && res.data.data) {
                const d = res.data.data;
                if (d.token) localStorage.setItem(TOKEN_KEY, d.token);
                const uid = (d.userInfo && (d.userInfo.id || d.userInfo.userId)) || d.id || 0;
                localStorage.setItem('h5-user-id', String(uid));
                const nickname = (d.userInfo && (d.userInfo.nickname || d.userInfo.nickName)) || email.split('@')[0];
                localStorage.setItem(USER_EMAIL_KEY, email);
                localStorage.setItem(USER_NICK_KEY, nickname);
                localStorage.setItem(LOGIN_TYPE_KEY, 'email');
                closeLoginModal();
                refreshProfileUI();
                showToast(t('loginSuccess'));
            } else {
                errEl.textContent = res.data && res.data.msg ? res.data.msg : t('loginFailed');
                errEl.classList.remove('hidden');
            }
        } catch (e) {
            console.warn('[emailLogin] failed:', e.message);
            errEl.textContent = t('loginFailed');
            errEl.classList.remove('hidden');
        } finally {
            btn.classList.remove('disabled');
            btn.textContent = t('loginBtn');
        }
    }

    // ===================== VIP 状态（本地） =====================
    const VIP_KEY = 'h5-vip-type'; // 'sub' | 'once' | null

    function isVipMember() { return !!localStorage.getItem(VIP_KEY); }
    function getVipType()   { return localStorage.getItem(VIP_KEY); }
    function activateVip(type) { localStorage.setItem(VIP_KEY, type); }
    function deactivateVip()   { localStorage.removeItem(VIP_KEY); }

    // ===================== VIP PAGE =====================
    function openVipPage() {
        const page = document.getElementById('page-vip');
        refreshVipPageUI();
        page.classList.remove('hidden');
        setTimeout(() => page.classList.add('active'), 10);
        bottomNav.style.display = 'none';
    }

    function closeVipPage() {
        const page = document.getElementById('page-vip');
        page.classList.remove('active');
        setTimeout(() => page.classList.add('hidden'), 300);
        bottomNav.style.display = 'flex';
    }

    function refreshVipPageUI() {
        const statusEl = document.getElementById('vip-status-bar');
        if (!statusEl) return;
        const type = getVipType();
        if (type === 'sub') {
            statusEl.textContent = '✅ ' + t('vipStatusSub');
            statusEl.classList.remove('hidden');
        } else if (type === 'once') {
            statusEl.textContent = '✅ ' + t('vipStatusOnce');
            statusEl.classList.remove('hidden');
        } else {
            statusEl.classList.add('hidden');
        }
    }

    // VIP 套餐选中状态
    let selectedVipPlan = 'sub'; // 'sub' | 'once'
    function onVipPlanTap(plan) {
        selectedVipPlan = plan;
        document.getElementById('vip-card-sub').classList.toggle('vip-plan-highlight', plan === 'sub');
        document.getElementById('vip-card-once').classList.toggle('vip-plan-highlight', plan === 'once');
    }

    function onVipPayTap() {
        activateVip(selectedVipPlan);
        refreshVipPageUI();
        document.getElementById('vip-success-modal').classList.remove('hidden');
    }

    function closeVipSuccessModal() {
        document.getElementById('vip-success-modal').classList.add('hidden');
    }

    function onVipCancelTap() {
        if (getVipType() === 'sub') {
            deactivateVip();
            refreshVipPageUI();
            showToast(t('vipCancelled'));
        } else {
            showToast(t('vipNotSub'));
        }
    }

    // ===================== 通用页面切换工具 =====================
    function openFeaturePage(pageId) {
        const page = document.getElementById(pageId);
        page.classList.remove('hidden');
        setTimeout(() => page.classList.add('active'), 10);
        bottomNav.style.display = 'none';
    }
    function closeFeaturePage(pageId) {
        const page = document.getElementById(pageId);
        page.classList.remove('active');
        setTimeout(() => page.classList.add('hidden'), 300);
        bottomNav.style.display = 'flex';
    }

    // ===================== 运动教程 =====================
    const IMG = 'https://images.unsplash.com/photo-';
    const TUTORIALS = [
        { id: 1, emoji: '🎾', title: '网球正手击球技术详解', desc: '从握拍到随挥的完整动作分解', memberOnly: false,
          coverImg: IMG + '1554068865-24cecd4e34b8?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、握拍方式', img: IMG + '1516688800765-3cc4d9aead55?w=700&h=320&fit=crop&q=80',
              content: '东方式握拍是初学者最推荐的握拍方式，将手掌置于拍柄的右侧斜面，拇指和食指形成"V"形，其余手指自然环握。握拍力度适中，过紧会导致手腕僵硬，影响击球的灵活性。' },
            { title: '二、准备姿势', content: '双脚分开与肩同宽，膝盖微弯，重心略微前倾。非持拍手托住球拍喉部，保持放松状态。眼睛始终盯住来球。' },
            { title: '三、引拍动作', content: '当判断来球为正手时，立即向右侧转体，同时右手向右后方引拍。引拍时球拍头低于腰部，为击球创造向上的加速路径。' },
            { title: '四、击球时机', img: IMG + '1587280501635-68a0e82cd5ff?w=700&h=320&fit=crop&q=80',
              content: '最佳击球点在身体前方约一个手臂距离处，高度在腰部到肩部之间。击球时重心从右脚转移至左脚，带动躯干旋转。' },
            { title: '五、随挥收拍', content: '击球后球拍继续向左肩方向随挥，结束时拍头指向天空或左肩后方。充分的随挥能增加击球力量和旋转。' }
          ]
        },
        { id: 2, emoji: '🏃', title: '反手击球进阶指南', desc: '单手与双手反手的技术要领', memberOnly: true,
          coverImg: IMG + '1541466050-72ba6b5b0dc5?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、双手反手握拍', img: IMG + '1551698618-1dfe5d97d256?w=700&h=320&fit=crop&q=80',
              content: '右手采用大陆式握拍，左手在右手上方采用东方式正手握拍。双手协调发力，左手提供推力，右手控制方向。' },
            { title: '二、转体引拍', content: '来球偏左时，迅速向左转体，双手将球拍引至右侧。引拍时保持肩膀充分转动，为发力储蓄动能。' },
            { title: '三、击球发力', content: '击球时以腰部为轴向左旋转，双腿蹬地，将力量从下肢传递至躯干再到手臂。接触球的瞬间手腕收紧，稳定拍面。' },
            { title: '四、常见错误', content: '①手臂过于主动用力，忽视腿部和躯干；②引拍不充分，击球时间仓促；③击球点太靠近身体，手肘顶人；④随挥不完整。' }
          ]
        },
        { id: 3, emoji: '💪', title: '发球技术完全教程', desc: '平击、上旋、切削发球全解析', memberOnly: true,
          coverImg: IMG + '1622279457486-62dcc4a431d6?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、平击发球', img: IMG + '1612872087775-a2f07e1e0a5c?w=700&h=320&fit=crop&q=80',
              content: '以大陆式握拍，抛球在右肩前上方，拍面垂直击打球的后侧。发球时全身伸展，形成完整的抛物线动作。平击发球速度快，是第一发球的主要选择。' },
            { title: '二、上旋发球', content: '抛球比平击发球略靠后，击打球的后上方，拍面从下向上刷过球体。上旋发球落地后弹跳快，对接发球员造成高弹点困扰。' },
            { title: '三、节奏与稳定', content: '发球节奏要一致，从抛球到击球保持流畅不停顿。练习时从慢速开始，先建立正确动作，再逐渐增加速度。' }
          ]
        },
        { id: 4, emoji: '🦶', title: '网球步法训练指南', desc: '快速移动与站位的核心技巧', memberOnly: false,
          coverImg: IMG + '1560012057-4372e14c5085?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、基础步法', img: IMG + '1474274153-89b18f29a7ae?w=700&h=300&fit=crop&q=80',
              content: '分步法：保持弓步移动，不允许双脚并拢，适合短距离快速移动。交叉步：适合大范围移动，前脚交叉迈出，速度快但稳定性略低。' },
            { title: '二、恢复站位', content: '每次击球后立即恢复底线中央，这是接下来移动的最优出发点。恢复时采用小碎步，保持膝盖弯曲、重心前倾的准备状态。' },
            { title: '三、步法训练方法', content: '①蜘蛛练习：在场地内设置多个目标点，计时跑位；②阶梯训练：提高脚步频率和灵活性；③影子练习：不用球，模拟移动击球。' }
          ]
        },
        { id: 5, emoji: '🧘', title: '网球热身与拉伸', desc: '避免运动损伤的完整热身方案', memberOnly: false,
          coverImg: IMG + '1571019613454-1cb2f99b2d8b?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、热身阶段（5-10分钟）', img: IMG + '1538805060975-3921ed219ca9?w=700&h=300&fit=crop&q=80',
              content: '慢跑绕场2-3圈，激活心肺系统。关节活动：顺逆时针转动脚踝、膝盖、髋部、肩膀、手腕，每个关节各10次。' },
            { title: '二、动态拉伸', content: '弓步前压：左右各10次，拉伸髋屈肌。腿部摆动：前后摆腿各10次，内外摆腿各10次。肩部旋转：手臂画大圈，正反各10次。' },
            { title: '三、运动后拉伸', img: IMG + '1520877880798-5ee0a2571d9e?w=700&h=300&fit=crop&q=80',
              content: '运动后进行静态拉伸，每个动作保持20-30秒。重点拉伸：小腿、大腿前后侧、肩膀和手腕。充分拉伸有助于肌肉恢复，减少酸痛。' }
          ]
        },
        { id: 6, emoji: '🏆', title: '比赛战术与策略分析', desc: '从单打到双打的战术思维', memberOnly: true,
          coverImg: IMG + '1546519638-68e109498ffc?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、发球战术', img: IMG + '1595435934249-5df7ed86e1c0?w=700&h=300&fit=crop&q=80',
              content: '发球是比赛的主动开局，善用大角度外角球和身体球交替，让对手难以预判。第一发球力求速度与落点，第二发球注重旋转与稳定，将对手推至被动位置。' },
            { title: '二、底线对抗策略', content: '建立稳定的斜线对打，伺机用直线突破。当对手回球质量下降时，果断变线或上前压制。保持对球的深度控制，不轻易打出短球送分。' },
            { title: '三、上网时机选择', content: '进攻型短球、对手回球较浅、或自己主动放小球后，是最佳上网时机。上网路线要压住中路，减少对手穿越角度，同时准备好应对挑高球。' },
            { title: '四、双打站位配合', content: '双打中后场球员发球/底线击球时，前场球员站在服务线附近，随时准备截击。双方移动应保持平行，一人上网则另一人跟进，避免空当被穿越。' }
          ]
        },
        { id: 7, emoji: '🎯', title: '网前截击与高压球', desc: '上网进攻的技术要领', memberOnly: true,
          coverImg: IMG + '1489619243109-4e0ea59cfe10?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、截击基础', img: IMG + '1504216069936-6a2d7a3af8a2?w=700&h=300&fit=crop&q=80',
              content: '截击时采用大陆式握拍，无需后摆，以短促有力的推击动作为主。拍面略朝上，接触点在身体前方，利用来球的速度反弹，减少主动发力。' },
            { title: '二、正反手截击', content: '正手截击：拍头高于手腕，向前推击球的外侧，打出斜线或直线。反手截击：手腕保持稳定，拍面角度控制落点，适合压制对手底线。' },
            { title: '三、高压球技术', content: '当对手挑高球时，迅速后退并侧身，用非持拍手指向来球方向辅助判断。以发球动作击打高压球，充分伸展身体，拍头从上向前下方加速挥过球体。' },
            { title: '四、上网心理建设', content: '上网后保持积极主动的心态，不因失误而退缩。多次练习可建立上网信心。即便被穿越，也要分析原因，调整下次上网的时机与站位。' }
          ]
        },
        { id: 8, emoji: '🏃', title: '网球体能训练计划', desc: '专项体能提升8周方案', memberOnly: true,
          coverImg: IMG + '1518611012118-696072aa579a?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '第1-2周：基础有氧', img: IMG + '1461896836374-0f22516aa6a6?w=700&h=300&fit=crop&q=80',
              content: '每次训练30-40分钟，包括：慢跑20分钟 + 绳梯步法练习10分钟 + 核心板支撑3组×30秒。目标：建立有氧基础，激活核心稳定性。' },
            { title: '第3-4周：力量启动', content: '每次45分钟：深蹲3组×12次 + 弓步走3组×10次/侧 + 弹力带侧步3组×15次 + 俯卧撑3组×15次。目标：强化腿部与上肢推力。' },
            { title: '第5-6周：爆发力训练', img: IMG + '1534438327776-a9d64bc43ba6?w=700&h=300&fit=crop&q=80',
              content: '每次50分钟：跳箱3组×8次 + 侧向跨步跳3组×10次/侧 + 药球旋转抛3组×12次。目标：提升起步速度和击球爆发力。' },
            { title: '第7-8周：专项整合', content: '每次60分钟：综合步法训练（蜘蛛跑）+ 击球移位组合 + 全场模拟对打。目标：将体能优势转化为场上实战能力。' }
          ]
        },
        { id: 9, emoji: '🎾', title: '上旋球技术精讲', desc: '增加击球旋转与稳定性', memberOnly: true,
          coverImg: IMG + '1554068865-24cecd4e34b8?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、上旋球原理', img: IMG + '1475823678248-624fc6f85785?w=700&h=300&fit=crop&q=80',
              content: '上旋球（Topspin）是拍面从下向上刷过球体，使球产生向前旋转。落地后弹跳快且高，迫使对手在高点处理球，增加其回球难度。' },
            { title: '二、握拍与站位', content: '西方式或半西方式握拍更有利于制造上旋。击球时身体侧对来球，引拍低于击球点，从低到高加速挥拍，接触球的后上方。' },
            { title: '三、练习方法', content: '①多球训练：喂球员连续喂球，专注挥拍路径从下往上；②靠墙练习：对着墙从低处拍向高处，感受拍面刷球的触感；③控制落点：有意识地打到指定区域，建立稳定性。' },
            { title: '四、比赛应用', content: '大角度上旋：打出大幅度斜线，拉开对手位置。高弹上旋：朝对手反手深角打出高弹球，限制其进攻。上旋与平击结合：交替变化节奏，打乱对手判断。' }
          ]
        },
        { id: 10, emoji: '✂️', title: '切削球与放小球', desc: '增加比赛变化的利器', memberOnly: true,
          coverImg: IMG + '1560012057-4372e14c5085?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、切削球技术', img: IMG + '1571019613454-1cb2f99b2d8b?w=700&h=300&fit=crop&q=80',
              content: '切削球（Slice）是拍面从上向下切过球的后侧，产生向后旋转（下旋）。球速较慢，落地后弹跳低，适合改变节奏、为自己争取时间或布置战术。' },
            { title: '二、切削的击球动作', content: '大陆式握拍，拍头高于腕部，拍面略向后仰，从高处向下切削球体外侧。随挥方向向前下延伸，不要过早收拍。击球点略靠近身体。' },
            { title: '三、放小球技术', content: '放小球（Drop Shot）需要极佳的手感与时机判断。用切削动作但力量极轻，球在网前短落地后几乎不弹起。最佳时机：对手站位靠后且来球较短时。' },
            { title: '四、战术运用', content: '切削可用于：①回接发球，压低弹跳；②底线过渡，打破对手节奏；③接近网前前的过渡球。放小球则作为奇袭利器，与高压、底线深球组合使用，让对手疲于奔命。' }
          ]
        },
        { id: 11, emoji: '🤝', title: '双打技术与站位配合', desc: '双打制胜的默契与分工策略', memberOnly: true,
          coverImg: IMG + '1546519638-68e109498ffc?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、双打基本站位', img: IMG + '1595435934249-5df7ed86e1c0?w=700&h=300&fit=crop&q=80',
              content: '发球方：发球者在底线，搭档在网前截击位（服务线附近）。接发球方：接球者在底线，搭档在对侧服务线附近。随击球方向平行移动，始终保持两人在同一横线上。' },
            { title: '二、发球上网战术', content: '发球后跟随上网，与前场搭档形成双网压制阵型。双网时要封住中路，减少对手穿越机会。搭档需随时准备处理对手的挑高球反击。' },
            { title: '三、破网战术', content: '对手双网时，可采用：①直线穿越球；②挑高弧线球迫使后退；③中路捅球利用两人之间空档。判断对手的弱侧，集中攻击。' },
            { title: '四、沟通与信号', content: '双打中的沟通至关重要。使用手势信号告知搭档发球方向（手背向外=外角，拳头=身体球）。每分结束后相互鼓励，保持节奏一致。' }
          ]
        },
        { id: 12, emoji: '📐', title: '接发球技术精讲', desc: '稳定接发球是比赛的关键', memberOnly: true,
          coverImg: IMG + '1587280501635-68a0e82cd5ff?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、准备姿势与站位', content: '接发球时站在底线附近，根据对手发球速度和落点调整站位。准备姿势要低重心、双腿开合，便于快速向任意方向移动。' },
            { title: '二、判断来球', img: IMG + '1554068865-24cecd4e34b8?w=700&h=300&fit=crop&q=80',
              content: '观察对手抛球位置判断发球类型：抛球靠前→平击；抛球靠后偏左→上旋；抛球偏右→切削。提前预判可赢得宝贵的反应时间。' },
            { title: '三、接第一发球', content: '第一发球速度快，以挡球为主，不强求主动进攻。目标是将球回到对角深区，给自己争取时间恢复站位，避免冒险进攻送分。' },
            { title: '四、接第二发球', content: '第二发球是进攻机会，可适当前压站位，主动接击。针对上旋发球高弹点，侧身用正手大力压制。切削发球要注意低弹点，蹲低身体挑起击球。' }
          ]
        },
        { id: 13, emoji: '🧠', title: '网球心理与竞技状态', desc: '心态决定比赛的胜负走向', memberOnly: true,
          coverImg: IMG + '1541466050-72ba6b5b0dc5?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、赛前心理准备', content: '比赛前避免过度思考结果，专注于执行计划。制定3个简单战术目标，如"每局发球上旋""优先打对手反手"。充分热身让身体激活，稳定赛前情绪。' },
            { title: '二、关键分的处理', content: '关键分（破发点、赛点）最容易出现失误。此时要降低击球节奏，以稳定为主。深呼吸，将注意力放在击球动作本身，而非比分结果。' },
            { title: '三、连续失误后的调整', content: '连续失误时要暂停节奏，整理拍弦，给自己冷静的时间。分析失误原因（是主动失误还是被动失误），针对性调整策略，不要在情绪激动时强行改变打法。' },
            { title: '四、保持专注', content: '每分之间用固定的准备动作（如弹跳、弄球）保持专注。忘记上一分，把注意力放在"此刻这一分"。比赛中避免与裁判过度争论，消耗精力。' }
          ]
        },
        { id: 14, emoji: '🛒', title: '网球装备选购与保养', desc: '选对装备让训练事半功倍', memberOnly: true,
          coverImg: IMG + '1516688800765-3cc4d9aead55?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、球拍选购指南', img: IMG + '1554068865-24cecd4e34b8?w=700&h=300&fit=crop&q=80',
              content: '初学者推荐拍面较大（100-110平方英寸）、重量较轻（260-280g）的球拍，甜区大、更容易击球。进阶球员可选拍面95-100平方英寸、重量285-305g的控制型球拍。' },
            { title: '二、球线选择与磅数', content: '初学者推荐多纤维线或尼龙线，弹性好，手臂友好，推荐磅数50-55磅。进阶选手可选聚酯硬线，增加旋转和控制，磅数55-60磅。磅数越低弹力越大，越高控制越精准。' },
            { title: '三、球鞋与护具', content: '网球鞋要选横向支撑好、鞋底耐磨的专项鞋，避免跑步鞋代替。护膝、护腕在高强度训练时保护关节。握把汗带要定期更换，保持手感。' },
            { title: '四、装备保养', content: '球拍避免高温暴晒和潮湿，碳纤维怕磕碰。球线在室外频繁打球建议每3个月更换一次。网球筒开封后最好一次用完，旧球弹性差影响练习质量。' }
          ]
        },
        { id: 15, emoji: '👶', title: '青少年网球训练要点', desc: '科学培养青少年网球技能', memberOnly: true,
          coverImg: IMG + '1474274153-89b18f29a7ae?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、分龄训练原则', content: '6-8岁：以游戏为主，培养兴趣，使用泡沫球和迷你球场。9-12岁：建立基础技术，重点抓握拍、步法和基本击球。13岁以上：专项技术训练，引入战术意识和竞技比赛。' },
            { title: '二、技术顺序安排', content: '建议顺序：①正手→②反手→③发球→④截击→⑤战术。每项技术打好基础再进入下一项，避免同时堆砌过多动作，造成技术混乱。' },
            { title: '三、保护身体发育', content: '青少年骨骼发育中，避免过度训练导致运动损伤。每周训练量循序渐进，充分热身与拉伸。发球动作要注意肩膀和肘部保护，避免过早练习高强度大力发球。' },
            { title: '四、心理与兴趣培养', content: '比赛结果不是唯一目标，鼓励进步而非苛求胜负。创造轻松的训练氛围，用游戏化方式设计练习。家长和教练的鼓励对青少年长期坚持至关重要。' }
          ]
        },
        { id: 16, emoji: '🏥', title: '网球伤病预防与康复', desc: '科学训练，远离运动损伤', memberOnly: true,
          coverImg: IMG + '1571019613454-1cb2f99b2d8b?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、常见网球伤病', img: IMG + '1520877880798-5ee0a2571d9e?w=700&h=300&fit=crop&q=80',
              content: '①网球肘（肱骨外上髁炎）：手腕伸展肌群过度使用，反手击球技术不当易引发；②肩袖损伤：发球和高压球动作中肩部旋转过度；③踝关节扭伤：快速变向时踝关节稳定性不足。' },
            { title: '二、预防措施', content: '充分热身，避免冷身体上场。掌握正确动作，减少错误用力对关节的损耗。训练量循序渐进，避免突然增加强度。定期做力量和柔韧性训练，增强关节稳定性。' },
            { title: '三、急性损伤处理', content: 'RICE原则：Rest（休息）、Ice（冰敷20分钟）、Compression（加压包扎）、Elevation（抬高患肢）。急性损伤24小时内切勿热敷，48小时后可温热水泡脚促进恢复。' },
            { title: '四、康复训练', content: '伤后恢复期进行低强度的关节活动和肌力训练，逐步恢复运动量。建议在专业康复师指导下制定恢复计划。完全康复前不要急于重返高强度对抗训练。' }
          ]
        },
        { id: 17, emoji: '🌟', title: '职业球员的训练日常', desc: '顶级选手的训练体系揭秘', memberOnly: true,
          coverImg: IMG + '1518611012118-696072aa579a?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、一天的训练安排', img: IMG + '1534438327776-a9d64bc43ba6?w=700&h=300&fit=crop&q=80',
              content: '职业球员通常：早上7点起床，8点体能训练（1.5小时）；10点上午技术训练（2小时）；下午2点战术和比赛模拟训练（2小时）；4点体能恢复训练（1小时）；晚上拉伸与冰浴恢复。' },
            { title: '二、技术训练的核心', content: '多球训练是提升技术的核心方法，教练高频喂球，球员专注在固定技术动作上重复练习。每天至少500个正手、300个反手的多球训练量，形成肌肉记忆。' },
            { title: '三、体能训练结构', content: '有氧基础（慢跑、自行车）+无氧爆发（冲刺、跳跃）+核心稳定（平板支撑、旋转练习）+敏捷性（绳梯、变向练习）。体能与技术是相辅相成的关系。' },
            { title: '四、恢复的重要性', content: '职业选手同样重视恢复：冰浴、按摩、拉伸缺一不可。睡眠是最重要的恢复手段，顶级选手保证每晚8-9小时睡眠。营养补充在训练后30分钟内完成蛋白质和碳水化合物补给。' }
          ]
        },
        { id: 18, emoji: '🥗', title: '网球运动营养与饮食', desc: '科学饮食为运动表现加分', memberOnly: true,
          coverImg: IMG + '1461896836374-0f22516aa6a6?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、赛前饮食', content: '比赛前2-3小时进食，以高碳水、低脂肪、适量蛋白质为主。推荐：全麦面包+鸡蛋+香蕉+酸奶。避免高脂肪、高纤维食物，防止肠胃不适影响发挥。' },
            { title: '二、比赛中补给', content: '每换边补充100-200ml运动饮料或水，及时补充电解质。长时间比赛（超过1.5小时）可补充香蕉、能量棒等快速碳水化合物，维持血糖水平和体力。' },
            { title: '三、训练后恢复饮食', content: '训练后30分钟内是黄金补给窗口：补充20-30g蛋白质（鸡胸肉、蛋白粉、希腊酸奶）促进肌肉修复；同时补充碳水（米饭、面条）恢复糖原储备。' },
            { title: '四、日常营养原则', content: '均衡饮食：碳水占50-60%，蛋白质占20-25%，脂肪占15-20%。多吃新鲜蔬果补充维生素和抗氧化物质。避免高糖饮料和酒精，保持良好的身体状态。' }
          ]
        },
        { id: 19, emoji: '📋', title: '赛前准备与赛后总结', desc: '系统化备赛让你更有把握', memberOnly: true,
          coverImg: IMG + '1546519638-68e109498ffc?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、赛前一周准备', content: '减少高强度训练量，保持感觉即可，避免赛前过度疲劳。安排好装备检查（球拍、球线、球鞋、换洗衣物）。调整作息时间，保证充足睡眠，不在赛前一天熬夜。' },
            { title: '二、赛前热身流程', content: '抵达球场后：5分钟慢跑激活心肺；5分钟动态拉伸关节；底线对打热身（正手→反手→对角→直线）；发球热身（慢速→正式力度）；截击和放小球练习。总计约25-30分钟。' },
            { title: '三、比赛中的调整', content: '第一盘开始时以稳定为主，探测对手特点（弱侧、体力、心理状态）。记录对手规律，在换边时利用90秒调整战术。不要过早放弃，网球比赛变数极大。' },
            { title: '四、赛后总结与成长', content: '比赛结束后尽快做赛后总结：记录本场比赛的得分点和失分点；分析战术执行情况；记下需要在训练中改进的技术环节。长期坚持赛后复盘是快速进步的关键。' }
          ]
        },
        { id: 20, emoji: '📜', title: '网球规则全面解析', desc: '了解规则，让比赛更顺畅', memberOnly: true,
          coverImg: IMG + '1560012057-4372e14c5085?w=800&h=360&fit=crop&q=80',
          sections: [
            { title: '一、计分规则', content: '网球计分：0→15→30→40→Game。Deuce（平局40:40）后需连赢2分。通常需赢得6局（需领先2局）赢得一盘，比赛通常为3盘2胜或5盘3胜。' },
            { title: '二、发球规则', content: '每分有2次发球机会，第一发球失误（出界或下网）可再发。第二发球再失误为双误，对手得分。发球必须对角线落入接发球方的服务区内，发球时脚不能踩线。' },
            { title: '三、裁判判决', content: '球压线即为界内。Let球（发球触网后进入正确区域）重发，不算失误。比赛中球触网柱或对手身体均可得分。对裁判判决有异议时，须在下一分开始前提出。' },
            { title: '四、常见规则细节', content: '①球弹两次后才击球失分；②手持球拍击球（非球拍框）有效；③双手接球视情况而定（正规比赛需单手反手也可双手）；④比赛中不得接受场外指导（职业规定）。' }
          ]
        }
    ];

    function openTutorialPage() {
        if (!isLoggedIn()) { openLoginModal(); return; }
        openFeaturePage('page-tutorial');
        renderTutorialList();
    }

    function renderTutorialList() {
        const list = document.getElementById('tutorial-list');
        list.innerHTML = '';
        TUTORIALS.forEach(item => {
            const card = document.createElement('div');
            card.className = 'tutorial-card';
            const badge = item.memberOnly
                ? `<span class="tutorial-card-badge tutorial-badge-vip">${t('tutorialVip')}</span>`
                : `<span class="tutorial-card-badge tutorial-badge-free">${t('tutorialFree')}</span>`;
            card.innerHTML = `
                <div class="tutorial-card-cover">${item.emoji}</div>
                <div class="tutorial-card-body">
                    ${badge}
                    <div class="tutorial-card-title">${item.title}</div>
                    <div class="tutorial-card-desc">${item.desc}</div>
                </div>`;
            card.addEventListener('click', () => openTutorialDetail(item));
            list.appendChild(card);
        });
    }

    function openTutorialDetail(item) {
        const detail = document.getElementById('tutorial-detail');
        document.getElementById('tutorial-detail-title').textContent = item.title;
        const content = document.getElementById('tutorial-detail-content');
        content.innerHTML = '';

        // 封面大图
        if (item.coverImg) {
            content.innerHTML = `<div class="tutorial-cover-wrap"><img class="tutorial-cover-img" src="${item.coverImg}" alt="${item.title}" loading="lazy"></div>`;
        }

        if (item.memberOnly && !isVipMember()) {
            content.innerHTML += `
                <div class="tutorial-vip-lock">
                    <div class="tutorial-vip-lock-icon">🔒</div>
                    <div class="tutorial-vip-lock-text">${t('tutorialVipTitle')}</div>
                    <div class="tutorial-vip-lock-sub">${t('tutorialVipSub')}</div>
                    <div class="tutorial-vip-btn" onclick="closeFeaturePage('page-tutorial');openVipPage()">${t('tutorialVipBtn')}</div>
                </div>`;
        } else {
            item.sections.forEach(sec => {
                const el = document.createElement('div');
                const imgHtml = sec.img
                    ? `<img class="tutorial-section-img" src="${sec.img}" alt="${sec.title}" loading="lazy">`
                    : '';
                el.innerHTML = `
                    <div class="tutorial-section-title">${sec.title}</div>
                    ${imgHtml}
                    <div class="tutorial-section-content">${sec.content}</div>`;
                content.appendChild(el);
            });
        }
        detail.classList.remove('hidden');
    }

    function closeTutorialDetail() {
        document.getElementById('tutorial-detail').classList.add('hidden');
    }

    // ===================== 喝水打卡 =====================
    const WATER_TARGET = 8;    // 杯
    const WATER_PER_CUP = 250; // ml
    const WATER_KEY = 'h5-water-data';
    // 圆弧周长 2π×66≈414.69
    const WATER_CIRCUMFERENCE = 2 * Math.PI * 66;

    function getTodayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    function loadWaterData() {
        try { return JSON.parse(localStorage.getItem(WATER_KEY) || '{}'); } catch(e) { return {}; }
    }

    function saveWaterData(data) {
        localStorage.setItem(WATER_KEY, JSON.stringify(data));
    }

    function openWaterPage() {
        if (!isLoggedIn()) { openLoginModal(); return; }
        openFeaturePage('page-water');
        renderWaterPage();
    }

    function renderWaterPage() {
        const today = getTodayKey();
        const d = new Date();
        document.getElementById('water-date').textContent =
            `${today}  ${['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]}`;

        const data = loadWaterData();
        const todayData = data[today] || { cups: 0, records: [] };
        updateWaterUI(todayData);
    }

    function updateWaterUI(todayData) {
        const cups = todayData.cups || 0;
        const ml   = cups * WATER_PER_CUP;
        const pct  = Math.min(cups / WATER_TARGET, 1);
        const offset = WATER_CIRCUMFERENCE * (1 - pct);

        document.getElementById('water-cups-text').textContent = `${cups}/${WATER_TARGET} 杯`;
        document.getElementById('water-ml-text').textContent   = `${ml} ml`;
        document.getElementById('water-arc').style.strokeDashoffset = offset;

        let mot = '加油补水💪';
        if (cups >= WATER_TARGET) mot = '今日目标达成🎉';
        else if (cups >= WATER_TARGET * 0.75) mot = '快完成了！';
        else if (cups >= WATER_TARGET * 0.5) mot = '超过一半了';
        document.getElementById('water-mot').textContent = mot;

        // 记录列表
        const records = document.getElementById('water-records');
        const recs = (todayData.records || []).slice().reverse();
        if (recs.length === 0) {
            records.innerHTML = `<div class="water-empty">${t('waterNoRecord')}</div>`;
        } else {
            records.innerHTML = recs.map(r => `
                <div class="water-record-item">
                    <span class="water-record-time">${r.time}</span>
                    <span class="water-record-amt">+${r.amount} ml</span>
                </div>`).join('');
        }
    }

    function bindWaterUI() {
        document.getElementById('water-back-btn').addEventListener('click', () => closeFeaturePage('page-water'));
        document.getElementById('water-plus-btn').addEventListener('click', () => {
            const today = getTodayKey();
            const data = loadWaterData();
            if (!data[today]) data[today] = { cups: 0, records: [] };
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            data[today].cups++;
            data[today].records.push({ time: timeStr, amount: WATER_PER_CUP });
            saveWaterData(data);
            updateWaterUI(data[today]);
            showToast(t('waterAdded'));
        });
        document.getElementById('water-minus-btn').addEventListener('click', () => {
            const today = getTodayKey();
            const data = loadWaterData();
            const td = data[today];
            if (!td || td.cups <= 0) { showToast(t('waterNoMore')); return; }
            td.cups--;
            td.records.pop();
            saveWaterData(data);
            updateWaterUI(td);
        });
    }

    // ===================== 训练计划 =====================
    const PLAN_KEY = 'h5-training-plans';
    let currentPlanTab = 'pending';

    const PLAN_COLORS = ['#e8f5e9','#e3f2fd','#fff3e0','#fce4ec','#f3e5f5','#e0f7fa'];
    const PLAN_ICON_COLORS = ['#43a047','#1e88e5','#fb8c00','#e53935','#8e24aa','#00acc1'];

    const DEFAULT_PLANS = [
        { id: 'p1', name: '基础挥拍训练', desc: '强化基础击球动作与节奏感', duration: 30, difficulty: 'easy',   bgIdx: 0, completed: false, createTime: Date.now() - 4*86400000 },
        { id: 'p2', name: '体能强化训练', desc: '提升爆发力与耐力综合体能', duration: 45, difficulty: 'medium', bgIdx: 1, completed: false, createTime: Date.now() - 3*86400000 },
        { id: 'p3', name: '步伐移动训练', desc: '快速移步与平衡恢复专项练习', duration: 40, difficulty: 'medium', bgIdx: 2, completed: true,  createTime: Date.now() - 2*86400000 },
        { id: 'p4', name: '高强度对抗训练', desc: '模拟比赛情景的高强度练习', duration: 60, difficulty: 'hard',   bgIdx: 3, completed: false, createTime: Date.now() - 86400000  }
    ];

    function loadPlans() {
        try {
            const raw = localStorage.getItem(PLAN_KEY);
            if (!raw) { savePlans(DEFAULT_PLANS); return DEFAULT_PLANS; }
            return JSON.parse(raw);
        } catch(e) { return DEFAULT_PLANS; }
    }

    function savePlans(plans) {
        localStorage.setItem(PLAN_KEY, JSON.stringify(plans));
    }

    function openPlanPage() {
        if (!isLoggedIn()) { openLoginModal(); return; }
        openFeaturePage('page-plan');
        renderPlanPage();
    }

    function renderPlanPage() {
        const plans = loadPlans();
        const pending = plans.filter(p => !p.completed);
        const done    = plans.filter(p =>  p.completed);
        document.getElementById('plan-total').textContent         = plans.length;
        document.getElementById('plan-pending-count').textContent = pending.length;
        document.getElementById('plan-done-count').textContent    = done.length;
        renderPlanList(currentPlanTab === 'pending' ? pending : done);
    }

    function renderPlanList(plans) {
        const list = document.getElementById('plan-list');
        if (plans.length === 0) {
            list.innerHTML = `<div class="plan-empty">${t('planEmpty')}</div>`;
            return;
        }
        const diffLabel = { easy: t('diffEasy'), medium: t('diffMedium'), hard: t('diffHard') };
        list.innerHTML = '';
        plans.forEach(plan => {
            const card = document.createElement('div');
            card.className = 'plan-card';
            const bg = PLAN_COLORS[plan.bgIdx % PLAN_COLORS.length];
            const ic = PLAN_ICON_COLORS[plan.bgIdx % PLAN_ICON_COLORS.length];
            const diff = plan.difficulty || 'easy';
            const actionBtn = plan.completed
                ? `<div class="plan-btn plan-btn-undo" onclick="togglePlan('${plan.id}',false)">${t('planUndo')}</div>`
                : `<div class="plan-btn plan-btn-complete" onclick="togglePlan('${plan.id}',true)">${t('planComplete')}</div>`;
            card.innerHTML = `
                <div class="plan-card-header">
                    <div class="plan-card-icon" style="background:${bg}">
                        <span class="material-icons" style="color:${ic};font-size:22px">fitness_center</span>
                    </div>
                    <div class="plan-card-info">
                        <div class="plan-card-name">${plan.name}</div>
                        <div class="plan-card-desc">${plan.desc || ''}</div>
                    </div>
                </div>
                <div class="plan-card-meta">
                    <span class="plan-meta-tag">⏱ ${plan.duration} 分钟</span>
                    <span class="plan-meta-tag plan-diff-${diff}">${diffLabel[diff]}</span>
                </div>
                <div class="plan-card-actions">
                    ${actionBtn}
                    <div class="plan-btn plan-btn-delete" onclick="deletePlan('${plan.id}')">${t('planDelete')}</div>
                </div>`;
            list.appendChild(card);
        });
    }

    function switchPlanTab(tab) {
        currentPlanTab = tab;
        document.getElementById('plan-tab-pending').classList.toggle('active', tab === 'pending');
        document.getElementById('plan-tab-done').classList.toggle('active', tab === 'done');
        renderPlanPage();
    }

    function togglePlan(id, completed) {
        const plans = loadPlans();
        const plan = plans.find(p => p.id === id);
        if (plan) { plan.completed = completed; savePlans(plans); }
        renderPlanPage();
        showToast(completed ? t('planCompleted') : t('planUndone'));
    }

    function deletePlan(id) {
        const plans = loadPlans().filter(p => p.id !== id);
        savePlans(plans);
        renderPlanPage();
        showToast(t('planDeleted'));
    }

    function openPlanModal() {
        document.getElementById('plan-name-input').value = '';
        document.getElementById('plan-desc-input').value = '';
        document.getElementById('plan-dur-input').value  = '30';
        document.getElementById('plan-diff-select').value = 'easy';
        document.getElementById('plan-modal').classList.remove('hidden');
    }

    function closePlanModal() {
        document.getElementById('plan-modal').classList.add('hidden');
    }

    function savePlan() {
        const name = (document.getElementById('plan-name-input').value || '').trim();
        if (!name) { showToast(t('planNameRequired')); return; }
        const plans = loadPlans();
        if (!isVipMember() && plans.length >= 2) {
            closePlanModal();
            showToast(t('planLimitReached'));
            setTimeout(openVipPage, 500);
            return;
        }
        const desc     = (document.getElementById('plan-desc-input').value || '').trim();
        const duration = parseInt(document.getElementById('plan-dur-input').value) || 30;
        const diff     = document.getElementById('plan-diff-select').value;
        const bgIdx    = plans.length % PLAN_COLORS.length;
        plans.unshift({ id: 'p' + Date.now(), name, desc, duration, difficulty: diff, bgIdx, completed: false, createTime: Date.now() });
        savePlans(plans);
        closePlanModal();
        renderPlanPage();
        showToast(t('planSaved'));
    }

    function bindPlanUI() {
        document.getElementById('plan-back-btn').addEventListener('click', () => closeFeaturePage('page-plan'));
        document.getElementById('plan-add-btn').addEventListener('click', openPlanModal);
        document.getElementById('plan-modal').addEventListener('click', e => { if (e.target === document.getElementById('plan-modal')) closePlanModal(); });
    }

    function bindTutorialUI() {
        document.getElementById('tutorial-back-btn').addEventListener('click', () => {
            const detail = document.getElementById('tutorial-detail');
            if (!detail.classList.contains('hidden')) { closeTutorialDetail(); return; }
            closeFeaturePage('page-tutorial');
        });
        document.getElementById('tutorial-detail-back').addEventListener('click', closeTutorialDetail);
    }

});

