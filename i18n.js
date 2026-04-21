/**
 * i18n — 轻量级多语言支持
 * 通过 region API 检测地区，匹配 zh / en / ja / ko 四种语言
 */
(function () {
    'use strict';

    // ===================== 翻译字典 =====================
    const messages = {
        zh: {
            // 首页顶栏
            mainTitle: '我是AI教练～',
            subTitle: '您的专属挥拍训练助手来啦！',
            // 场景推荐
            sectionScene: '场景推荐',
            sceneHome: '在家挥拍',
            sceneHomeSub: '适配客厅/卧室的轻量训练',
            sceneSolo: '个人练习',
            sceneSoloSub: '强化节奏与动作连贯性',
            sceneFam: '亲子陪练',
            sceneFamSub: '亲子互动，轻松入门',
            sceneDuo: '双人对打',
            sceneDuoSub: '提升反应与对抗强度',
            // 换脸入口
            sectionFaceSwap: '成为运动主角',
            faceSwapDesc: '选一段模板，拍一张正脸，让 AI 把你带入运动大片',
            template1: '模板一',
            template2: '模板二',
            template3: '模板三',
            template4: '模板四',
            useBtn: '使用',
            // 更多运动
            sectionMoreSports: '更多运动',
            comingSoon: '开发中，敬请期待',
            sportSwim: '游泳',
            sportCricket: '板球',
            sportFitness: '健身私教',
            sportPickleball: '匹克球',
            sportTableTennis: '乒乓球',
            sportBadminton: '羽毛球',
            sportPilates: '普拉提',
            sportGolf: '高尔夫',
            // 分析页
            analysisTitle: '挥拍分析',
            shareBtn: '分享',
            aiAnalyzing: 'AI 教练分析中',
            analysisHint: '请稍候，通常需要 10~30 秒',
            noResult: '暂无分析结果',
            preparing: '准备上传...',
            aiAnalyzingAction: 'AI 正在分析动作...',
            emptyContent: '解析后内容为空',
            serverError: '服务器返回错误',
            analysisFailed: '分析失败',
            networkError: '网络错误',
            retryBtn: '重试',
            invalidVideo: '请选择有效的视频文件',
            resultEmpty: '分析结果为空',
            // 我的页
            privacyPolicy: '隐私政策',
            specialLaw: '特商法',
            userAgreement: '用户协议',
            moreComingSoon: '更多运动，敬请期待',
            // 换脸页
            faceSwapTitle: 'AI 运动写真',
            currentTemplate: '当前模板',
            uploadFacePhoto: '上传人脸照片',
            templatePreview: '模板预览',
            clickUpload: '点击上传',
            faceTips: '请确保照片中只有一张人脸，五官清晰，正脸角度偏侧不超过 30°',
            startGenerate: '开始生成',
            synthesizing: 'AI 合成中，请稍候...',
            synthesisTime: '视频合成通常需要 1~3 分钟',
            synthesisResult: '合成结果',
            regenerate: '重新生成',
            saveVideo: '保存视频',
            generateFailed: '生成失败',
            checkNetwork: '请检查网络后重试',
            retryGenerate: '重新尝试',
            // 底部导航
            tabHome: '首页',
            tabShoot: '拍摄分析',
            tabMe: '我的',
            // JS 动态文本
            selectImage: '请选择 JPG 或 PNG 图片',
            uploadFaceFirst: '请先上传人脸照片',
            uploadingImage: '上传图片中...',
            uploadingFace: '正在上传人脸图片...',
            generating: '生成中...',
            submitFailed: '任务提交失败',
            queryFailed: '查询失败：',
            synthesisFailed: '合成失败，请重试',
            networkException: '网络异常：',
            generated: '已生成',
            networkRequestFailed: '网络请求失败，请重试',
        },
        en: {
            mainTitle: "I'm AI Coach~",
            subTitle: 'Your personal swing training assistant is here!',
            sectionScene: 'Scenarios',
            sceneHome: 'Home Swing',
            sceneHomeSub: 'Light training for living room / bedroom',
            sceneSolo: 'Solo Practice',
            sceneSoloSub: 'Improve rhythm and movement flow',
            sceneFam: 'Family Training',
            sceneFamSub: 'Parent-child interactive beginner course',
            sceneDuo: 'Doubles Match',
            sceneDuoSub: 'Boost reaction and competition intensity',
            sectionFaceSwap: 'Be the Sports Star',
            faceSwapDesc: 'Pick a template, take a selfie, and let AI put you in the spotlight',
            template1: 'Template 1',
            template2: 'Template 2',
            template3: 'Template 3',
            template4: 'Template 4',
            useBtn: 'Use',
            sectionMoreSports: 'More Sports',
            comingSoon: 'Coming soon, stay tuned',
            sportSwim: 'Swimming',
            sportCricket: 'Cricket',
            sportFitness: 'Personal Training',
            sportPickleball: 'Pickleball',
            sportTableTennis: 'Table Tennis',
            sportBadminton: 'Badminton',
            sportPilates: 'Pilates',
            sportGolf: 'Golf',
            analysisTitle: 'Swing Analysis',
            shareBtn: 'Share',
            aiAnalyzing: 'AI Coach Analyzing',
            analysisHint: 'Please wait, usually 10~30 seconds',
            noResult: 'No analysis results yet',
            preparing: 'Preparing to upload...',
            aiAnalyzingAction: 'AI is analyzing your movement...',
            emptyContent: 'Parsed content is empty',
            serverError: 'Server returned an error',
            analysisFailed: 'Analysis failed',
            networkError: 'Network error',
            retryBtn: 'Retry',
            invalidVideo: 'Please select a valid video file',
            resultEmpty: 'Analysis result is empty',
            privacyPolicy: 'Privacy Policy',
            specialLaw: 'Specified Commercial Transactions Act',
            userAgreement: 'User Agreement',
            moreComingSoon: 'More sports coming soon',
            faceSwapTitle: 'AI Sports Portrait',
            currentTemplate: 'Current Template',
            uploadFacePhoto: 'Upload Face Photo',
            templatePreview: 'Template Preview',
            clickUpload: 'Tap to Upload',
            faceTips: 'Ensure only one face in the photo, with clear features and frontal angle within 30°',
            startGenerate: 'Start',
            synthesizing: 'AI synthesizing, please wait...',
            synthesisTime: 'Video synthesis usually takes 1~3 minutes',
            synthesisResult: 'Synthesis Result',
            regenerate: 'Regenerate',
            saveVideo: 'Save Video',
            generateFailed: 'Generation Failed',
            checkNetwork: 'Please check your network and try again',
            retryGenerate: 'Try Again',
            tabHome: 'Home',
            tabShoot: 'Analyze',
            tabMe: 'Me',
            selectImage: 'Please select a JPG or PNG image',
            uploadFaceFirst: 'Please upload a face photo first',
            uploadingImage: 'Uploading image...',
            uploadingFace: 'Uploading face photo...',
            generating: 'Generating...',
            submitFailed: 'Task submission failed',
            queryFailed: 'Query failed: ',
            synthesisFailed: 'Synthesis failed, please retry',
            networkException: 'Network error: ',
            generated: 'Generated',
            networkRequestFailed: 'Network request failed, please retry',
        },
        ja: {
            mainTitle: 'AI コーチです～',
            subTitle: 'あなた専属のスイング練習アシスタント登場！',
            sectionScene: 'シーンおすすめ',
            sceneHome: '自宅でスイング',
            sceneHomeSub: 'リビング/寝室向けの軽量トレーニング',
            sceneSolo: '個人練習',
            sceneSoloSub: 'リズムと動作の連続性を強化',
            sceneFam: '親子トレーニング',
            sceneFamSub: '親子で楽しく、気軽に入門',
            sceneDuo: 'ダブルス対戦',
            sceneDuoSub: '反応力と対戦強度をアップ',
            sectionFaceSwap: 'スポーツの主役になろう',
            faceSwapDesc: 'テンプレートを選んで、正面写真を撮って、AIがあなたをスポーツシーンへ',
            template1: 'テンプレート1',
            template2: 'テンプレート2',
            template3: 'テンプレート3',
            template4: 'テンプレート4',
            useBtn: '使用',
            sectionMoreSports: 'その他のスポーツ',
            comingSoon: '開発中、お楽しみに',
            sportSwim: '水泳',
            sportCricket: 'クリケット',
            sportFitness: 'パーソナルトレーニング',
            sportPickleball: 'ピックルボール',
            sportTableTennis: '卓球',
            sportBadminton: 'バドミントン',
            sportPilates: 'ピラティス',
            sportGolf: 'ゴルフ',
            analysisTitle: 'スイング分析',
            shareBtn: 'シェア',
            aiAnalyzing: 'AI コーチが分析中',
            analysisHint: 'しばらくお待ちください、通常10〜30秒',
            noResult: '分析結果がありません',
            preparing: 'アップロード準備中...',
            aiAnalyzingAction: 'AI が動作を分析中...',
            emptyContent: '解析結果が空です',
            serverError: 'サーバーエラーが発生しました',
            analysisFailed: '分析に失敗しました',
            networkError: 'ネットワークエラー',
            retryBtn: 'リトライ',
            invalidVideo: '有効な動画ファイルを選択してください',
            resultEmpty: '分析結果が空です',
            privacyPolicy: 'プライバシーポリシー',
            specialLaw: '特定商取引法に基づく表記',
            userAgreement: '利用規約',
            moreComingSoon: 'その他のスポーツは近日公開',
            faceSwapTitle: 'AI スポーツ写真',
            currentTemplate: '現在のテンプレート',
            uploadFacePhoto: '顔写真をアップロード',
            templatePreview: 'テンプレートプレビュー',
            clickUpload: 'タップしてアップロード',
            faceTips: '写真に顔が1つだけ写っていること、顔のパーツがはっきりしていること、正面から30°以内であることを確認してください',
            startGenerate: '生成開始',
            synthesizing: 'AI 合成中、お待ちください...',
            synthesisTime: '動画合成には通常1〜3分かかります',
            synthesisResult: '合成結果',
            regenerate: '再生成',
            saveVideo: '動画を保存',
            generateFailed: '生成に失敗しました',
            checkNetwork: 'ネットワークを確認して再試行してください',
            retryGenerate: '再試行',
            tabHome: 'ホーム',
            tabShoot: '撮影分析',
            tabMe: 'マイページ',
            selectImage: 'JPGまたはPNG画像を選択してください',
            uploadFaceFirst: '先に顔写真をアップロードしてください',
            uploadingImage: '画像アップロード中...',
            uploadingFace: '顔写真アップロード中...',
            generating: '生成中...',
            submitFailed: 'タスクの送信に失敗しました',
            queryFailed: 'クエリ失敗：',
            synthesisFailed: '合成に失敗しました。再試行してください',
            networkException: 'ネットワーク異常：',
            generated: '生成済み',
            networkRequestFailed: 'ネットワークリクエスト失敗、再試行してください',
        },
        ko: {
            mainTitle: '저는 AI 코치입니다～',
            subTitle: '당신만의 스윙 트레이닝 어시스턴트가 왔어요!',
            sectionScene: '추천 장면',
            sceneHome: '집에서 스윙',
            sceneHomeSub: '거실/침실에서 가볍게 훈련',
            sceneSolo: '개인 연습',
            sceneSoloSub: '리듬과 동작 연속성 강화',
            sceneFam: '부모자녀 훈련',
            sceneFamSub: '부모와 함께 즐겁게 입문',
            sceneDuo: '복식 대결',
            sceneDuoSub: '반응력과 대결 강도 향상',
            sectionFaceSwap: '스포츠의 주인공이 되세요',
            faceSwapDesc: '템플릿을 선택하고 정면 사진을 찍어 AI가 당신을 스포츠 영상에 넣어드립니다',
            template1: '템플릿 1',
            template2: '템플릿 2',
            template3: '템플릿 3',
            template4: '템플릿 4',
            useBtn: '사용',
            sectionMoreSports: '더 많은 스포츠',
            comingSoon: '개발 중, 기대해 주세요',
            sportSwim: '수영',
            sportCricket: '크리켓',
            sportFitness: '개인 트레이닝',
            sportPickleball: '피클볼',
            sportTableTennis: '탁구',
            sportBadminton: '배드민턴',
            sportPilates: '필라테스',
            sportGolf: '골프',
            analysisTitle: '스윙 분석',
            shareBtn: '공유',
            aiAnalyzing: 'AI 코치 분석 중',
            analysisHint: '잠시 기다려 주세요, 보통 10~30초 소요',
            noResult: '분석 결과가 없습니다',
            preparing: '업로드 준비 중...',
            aiAnalyzingAction: 'AI가 동작을 분석하고 있습니다...',
            emptyContent: '파싱된 내용이 비어 있습니다',
            serverError: '서버 오류가 발생했습니다',
            analysisFailed: '분석에 실패했습니다',
            networkError: '네트워크 오류',
            retryBtn: '다시 시도',
            invalidVideo: '유효한 동영상 파일을 선택해 주세요',
            resultEmpty: '분석 결과가 비어 있습니다',
            privacyPolicy: '개인정보 처리방침',
            specialLaw: '특정 상거래법',
            userAgreement: '이용약관',
            moreComingSoon: '더 많은 스포츠 곧 출시',
            faceSwapTitle: 'AI 스포츠 포토',
            currentTemplate: '현재 템플릿',
            uploadFacePhoto: '얼굴 사진 업로드',
            templatePreview: '템플릿 미리보기',
            clickUpload: '탭하여 업로드',
            faceTips: '사진에 얼굴이 하나만 있고, 이목구비가 선명하며, 정면에서 30° 이내인지 확인해 주세요',
            startGenerate: '생성 시작',
            synthesizing: 'AI 합성 중, 잠시 기다려 주세요...',
            synthesisTime: '동영상 합성은 보통 1~3분 소요됩니다',
            synthesisResult: '합성 결과',
            regenerate: '다시 생성',
            saveVideo: '동영상 저장',
            generateFailed: '생성에 실패했습니다',
            checkNetwork: '네트워크를 확인하고 다시 시도해 주세요',
            retryGenerate: '다시 시도',
            tabHome: '홈',
            tabShoot: '촬영 분석',
            tabMe: '마이페이지',
            selectImage: 'JPG 또는 PNG 이미지를 선택해 주세요',
            uploadFaceFirst: '먼저 얼굴 사진을 업로드해 주세요',
            uploadingImage: '이미지 업로드 중...',
            uploadingFace: '얼굴 사진 업로드 중...',
            generating: '생성 중...',
            submitFailed: '작업 제출에 실패했습니다',
            queryFailed: '조회 실패: ',
            synthesisFailed: '합성에 실패했습니다. 다시 시도해 주세요',
            networkException: '네트워크 오류: ',
            generated: '생성 완료',
            networkRequestFailed: '네트워크 요청 실패, 다시 시도해 주세요',
        },
        hi: {
            mainTitle: 'मैं AI कोच हूँ~',
            subTitle: 'आपका अपना स्विंग ट्रेनिंग असिस्टेंट आ गया!',
            sectionScene: 'अनुशंसित परिदृश्य',
            sceneHome: 'घर पर स्विंग',
            sceneHomeSub: 'लिविंग रूम/बेडरूम के लिए हल्का प्रशिक्षण',
            sceneSolo: 'व्यक्तिगत अभ्यास',
            sceneSoloSub: 'लय और गति की निरंतरता को मजबूत करें',
            sceneFam: 'पारिवारिक प्रशिक्षण',
            sceneFamSub: 'माता-पिता और बच्चे मिलकर, आसानी से शुरुआत करें',
            sceneDuo: 'डबल्स मैच',
            sceneDuoSub: 'प्रतिक्रिया और प्रतिस्पर्धा की तीव्रता बढ़ाएं',
            sectionFaceSwap: 'खेल के नायक बनें',
            faceSwapDesc: 'एक टेम्पलेट चुनें, सेल्फी लें, और AI आपको स्पोर्ट्स वीडियो में डाल देगा',
            template1: 'टेम्पलेट 1',
            template2: 'टेम्पलेट 2',
            template3: 'टेम्पलेट 3',
            template4: 'टेम्पलेट 4',
            useBtn: 'उपयोग करें',
            sectionMoreSports: 'और खेल',
            comingSoon: 'जल्द आ रहा है, बने रहें',
            sportSwim: 'तैराकी',
            sportCricket: 'क्रिकेट',
            sportFitness: 'पर्सनल ट्रेनिंग',
            sportPickleball: 'पिकलबॉल',
            sportTableTennis: 'टेबल टेनिस',
            sportBadminton: 'बैडमिंटन',
            sportPilates: 'पिलाटेस',
            sportGolf: 'गोल्फ',
            analysisTitle: 'स्विंग विश्लेषण',
            shareBtn: 'शेयर करें',
            aiAnalyzing: 'AI कोच विश्लेषण कर रहा है',
            analysisHint: 'कृपया प्रतीक्षा करें, आमतौर पर 10~30 सेकंड',
            noResult: 'कोई विश्लेषण परिणाम नहीं',
            preparing: 'अपलोड की तैयारी हो रही है...',
            aiAnalyzingAction: 'AI आपकी गतिविधि का विश्लेषण कर रहा है...',
            emptyContent: 'पार्स की गई सामग्री खाली है',
            serverError: 'सर्वर त्रुटि हुई',
            analysisFailed: 'विश्लेषण विफल रहा',
            networkError: 'नेटवर्क त्रुटि',
            retryBtn: 'पुनः प्रयास करें',
            invalidVideo: 'कृपया एक वैध वीडियो फ़ाइल चुनें',
            resultEmpty: 'विश्लेषण परिणाम खाली है',
            privacyPolicy: 'गोपनीयता नीति',
            specialLaw: 'विशेष वाणिज्यिक लेनदेन अधिनियम',
            userAgreement: 'उपयोगकर्ता अनुबंध',
            moreComingSoon: 'और खेल जल्द आ रहे हैं',
            faceSwapTitle: 'AI स्पोर्ट्स पोर्ट्रेट',
            currentTemplate: 'वर्तमान टेम्पलेट',
            uploadFacePhoto: 'चेहरे की फ़ोटो अपलोड करें',
            templatePreview: 'टेम्पलेट पूर्वावलोकन',
            clickUpload: 'अपलोड करने के लिए टैप करें',
            faceTips: 'सुनिश्चित करें कि फ़ोटो में केवल एक चेहरा हो, विशेषताएं स्पष्ट हों, और कोण 30° के भीतर हो',
            startGenerate: 'बनाना शुरू करें',
            synthesizing: 'AI संश्लेषण कर रहा है, कृपया प्रतीक्षा करें...',
            synthesisTime: 'वीडियो संश्लेषण में आमतौर पर 1~3 मिनट लगते हैं',
            synthesisResult: 'संश्लेषण परिणाम',
            regenerate: 'पुनः बनाएं',
            saveVideo: 'वीडियो सहेजें',
            generateFailed: 'निर्माण विफल रहा',
            checkNetwork: 'कृपया नेटवर्क जांचें और पुनः प्रयास करें',
            retryGenerate: 'पुनः प्रयास करें',
            tabHome: 'होम',
            tabShoot: 'विश्लेषण',
            tabMe: 'मेरा',
            selectImage: 'कृपया JPG या PNG छवि चुनें',
            uploadFaceFirst: 'पहले चेहरे की फ़ोटो अपलोड करें',
            uploadingImage: 'छवि अपलोड हो रही है...',
            uploadingFace: 'चेहरे की फ़ोटो अपलोड हो रही है...',
            generating: 'बनाया जा रहा है...',
            submitFailed: 'कार्य सबमिट करने में विफल',
            queryFailed: 'क्वेरी विफल: ',
            synthesisFailed: 'संश्लेषण विफल, पुनः प्रयास करें',
            networkException: 'नेटवर्क त्रुटि: ',
            generated: 'बन गया',
            networkRequestFailed: 'नेटवर्क अनुरोध विफल, पुनः प्रयास करें',
        }
    };

    // ===================== 语言映射 =====================
    // region API 返回的 language 字段映射到我们支持的语言
    function mapLanguage(lang) {
        if (!lang) return 'zh';
        var l = lang.toLowerCase();
        if (l === 'zh' || l.startsWith('zh')) return 'zh';
        if (l === 'ja' || l.startsWith('ja')) return 'ja';
        if (l === 'ko' || l.startsWith('ko')) return 'ko';
        if (l === 'hi' || l.startsWith('hi')) return 'hi';
        return 'en'; // 其他国家都走英文
    }

    // analysis API 的 type 字段映射
    var typeMap = {
        zh: 'tennis',
        en: 'tennis_en',
        ja: 'tennis_jp',
        ko: 'tennis_kr',
        hi: 'tennis_hi'
    };

    // banner 视频映射
    var bannerVideoMap = {
        zh: 'assets/images/home/banner_video.mp4',
        en: 'assets/images/home/banner_video_en.mp4',
        ja: 'assets/images/home/banner_video_jp.mp4',
        ko: 'assets/images/home/banner_video_ko.mp4',
        hi: 'assets/images/home/banner_video_hi.mp4'
    };

    // ===================== 全局状态 =====================
    var currentLang = 'zh'; // 默认中文

    // ===================== 公共 API =====================
    /** 获取翻译文本 */
    function t(key) {
        var dict = messages[currentLang] || messages.zh;
        return dict[key] !== undefined ? dict[key] : (messages.zh[key] || key);
    }

    /** 获取当前语言 */
    function getLang() { return currentLang; }

    /** 获取 analysis type 字段值 */
    function getAnalysisType() { return typeMap[currentLang] || 'tennis_en'; }

    /** 设置语言并刷新所有带 data-i18n 的 DOM */
    function setLang(lang) {
        currentLang = lang;
        applyI18n();
    }

    /** 遍历所有 data-i18n 元素，替换文本 */
    function applyI18n() {
        var els = document.querySelectorAll('[data-i18n]');
        console.log('[i18n] applyI18n → 当前语言:', currentLang, '| 需要翻译的元素数:', els.length);
        for (var i = 0; i < els.length; i++) {
            var key = els[i].getAttribute('data-i18n');
            if (key) els[i].textContent = t(key);
        }
        // 同步 HTML lang 属性
        var langMap = { zh: 'zh-CN', en: 'en', ja: 'ja', ko: 'ko', hi: 'hi' };
        document.documentElement.lang = langMap[currentLang] || 'en';
        console.log('[i18n] applyI18n 完成, html lang 设为:', document.documentElement.lang);
    }

    /** 通过浏览器语言检测，返回 Promise（同步完成，保持 Promise 接口兼容） */
    function detectLanguage() {
        // 取浏览器第一优先语言，如 "zh-CN"、"en-US"、"ja"、"ko-KR"
        var rawLang = (navigator.languages && navigator.languages[0]) || navigator.language || 'zh';
        console.log('[i18n] 浏览器语言:', rawLang);
        currentLang = mapLanguage(rawLang);
        console.log('[i18n] 检测结果:', currentLang, '| analysisType:', typeMap[currentLang]);
        return Promise.resolve();
    }

    // ===================== 暴露到全局 =====================
    /** 获取当前语言对应的 banner 视频路径 */
    function getBannerVideo() {
        return bannerVideoMap[currentLang] || bannerVideoMap.zh;
    }

    window.i18n = {
        t: t,
        getLang: getLang,
        setLang: setLang,
        applyI18n: applyI18n,
        detectLanguage: detectLanguage,
        getAnalysisType: getAnalysisType,
        getBannerVideo: getBannerVideo
    };
})();
