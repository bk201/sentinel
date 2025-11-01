/**
 * Translation definitions for the application
 * Supports English (en), Traditional Chinese (zh-TW), Simplified Chinese (zh-CN), and Japanese (ja)
 */

export type Language = 'en' | 'zh-TW' | 'zh-CN' | 'ja'

export interface Translations {
  // Common
  common: {
    loading: string
    error: string
    cancel: string
    confirm: string
    retry: string
    back: string
  }
  
  // Header
  header: {
    title: string
    subtitle: string
  }
  
  // Drop Zone
  dropZone: {
    title: string
    selectButton: string
    dragAndDrop: string
    clickToSelect: string
    processingFolder: string
    validationError: string
    failedToSelect: string
    dropFolderOnly: string
    dragDropLimited: string
    failedToProcess: string
  }
  
  // Requirements
  requirements: {
    title: string
    folderFormat: string
    example: string
    browserSupport: string
    demoVideoDescription: string
  }
  
  // Clip Selector
  clipSelector: {
    title: string
    foundClips: string
    selectOne: string
    clip: string
    latest: string
    files: string
    duration: string
    confirmButton: string
  }
  
  // Validation Spinner
  validation: {
    validating: string
    analyzing: string
  }
  
  // Player
  player: {
    processing: string
    front: string
    back: string
    left: string
    right: string
    playbackRate: string
    eventButtonText: string
    showEvent: string
    hideEvent: string
    jumpToEvent: string
    rewind: string
    forward: string
    play: string
    pause: string
    replay: string
    closeClip: string
    debugJumpToEnd: string
  }
  
  // Sidebar
  sidebar: {
    clipDetails: string
    clipInformation: string
    clipStart: string
    clipEnd: string
    totalDuration: string
    currentFootage: string
    footage: string
    dateTime: string
    duration: string
    warning: string
    missingCameras: string
    videoFiles: string
    showDetails: string
    closeDetails: string
  }
  
  // Event Info
  event: {
    title: string
    timestamp: string
    location: string
    city: string
    reason: string
    camera: string
    navigate: string
    viewOnOpenStreetMap: string
    viewOnGoogleMaps: string
  }
  
  // Error Messages
  errors: {
    validationError: string
    selectDifferentFolder: string
    tryAgain: string
    failedToLoad: string
  }
  
  // Disclaimer
  disclaimer: {
    title: string
    privacyFirst: string
    noUploads: string
    openSource: string
    understood: string
    featuresTitle: string
    multiCamera: string
    gridView: string
    eventInfo: string
    browserRequirementsTitle: string
    modernBrowser: string
    supportedBrowsers: string
    notAffiliated: string
    createdBy: string
  }
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      cancel: 'Cancel',
      confirm: 'Confirm',
      retry: 'Retry',
      back: 'Back'
    },
    header: {
      title: 'Sentinel',
      subtitle: 'Play your Tesla dashcam clips'
    },
    dropZone: {
      title: 'Select Tesla Dashcam Folder',
      selectButton: 'Select Folder',
      dragAndDrop: 'Drop your Tesla dashcam folder here or click to browse',
      clickToSelect: 'Click to browse and select a Tesla dashcam folder',
      processingFolder: 'Processing folder...',
      validationError: 'Validation Error',
      failedToSelect: 'Failed to select folder',
      dropFolderOnly: 'Please drop a Tesla dashcam folder',
      dragDropLimited: 'Drag & drop folder support is limited. Please use the "Select Folder" button.',
      failedToProcess: 'Failed to process dropped folder'
    },
    requirements: {
      title: 'Requirements:',
      folderFormat: 'Tesla dashcam folder with timestamp format (YYYY-MM-DD_HH-MM-SS)',
      example: 'For example, the "2025-10-20_19-52-58" folder in the "SentryClips" folder',
      browserSupport: 'Works in all modern browsers (Chrome, Firefox, Safari, Edge)',
      demoVideoDescription: 'Watch how to select and view your Tesla dashcam clips'
    },
    clipSelector: {
      title: 'Multiple Clips Detected',
      foundClips: 'Found {count} recording sessions in this folder. Select one to view:',
      selectOne: 'Select one to view:',
      clip: 'Clip',
      latest: 'Latest',
      files: 'files',
      duration: 'Duration',
      confirmButton: 'Load Selected Clip'
    },
    validation: {
      validating: 'Validating folder...',
      analyzing: 'Analyzing Tesla dashcam folder structure and validating video files...'
    },
    player: {
      processing: 'Processing Tesla dashcam footages...',
      front: 'Front',
      back: 'Back',
      left: 'Left',
      right: 'Right',
      playbackRate: 'Playback Rate',
      eventButtonText: 'Jump to Event',
      showEvent: 'Show Event Info',
      hideEvent: 'Hide Event Info',
      jumpToEvent: 'Jump to Event',
      rewind: 'Rewind 5s',
      forward: 'Forward 5s',
      play: 'Play',
      pause: 'Pause',
      replay: 'Replay from start',
      closeClip: 'Close Clip',
      debugJumpToEnd: 'Jump to 3s before footage end (Debug)'
    },
    sidebar: {
      clipDetails: 'CLIP DETAILS',
      clipInformation: 'Clip Information',
      clipStart: 'Clip Start',
      clipEnd: 'Clip End',
      totalDuration: 'Total Duration',
      currentFootage: 'Current Footage',
      footage: 'Footage',
      dateTime: 'Date & Time',
      duration: 'Duration',
      warning: 'Warning',
      missingCameras: 'Missing camera feeds',
      videoFiles: 'Video Files',
      showDetails: 'Show Details',
      closeDetails: 'Close Details'
    },
    event: {
      title: 'Event Information',
      timestamp: 'Timestamp',
      location: 'Location',
      city: 'City',
      reason: 'Reason',
      camera: 'Camera',
      navigate: 'Navigate to Event',
      viewOnOpenStreetMap: 'View on OpenStreetMap',
      viewOnGoogleMaps: 'View on Google Maps'
    },
    errors: {
      validationError: 'Validation Error',
      selectDifferentFolder: 'Select Different Folder',
      tryAgain: 'Try Again',
      failedToLoad: 'Failed to load'
    },
    disclaimer: {
      title: 'Privacy & Security Notice',
      privacyFirst: '🔒 All video processing happens entirely in your browser.',
      noUploads: '📁 No files are uploaded to any server.',
      openSource: '🔓 Open source code you can verify.',
      understood: 'I Understand',
      featuresTitle: 'Features',
      multiCamera: 'Multi-camera synchronized playback',
      gridView: 'Grid view or camera-focus view',
      eventInfo: 'Event information, location, and navigation',
      browserRequirementsTitle: 'Browser Requirements',
      modernBrowser: 'A modern browser with mp4 codec support',
      supportedBrowsers: 'Chrome, Edge, Firefox, and Safari',
      notAffiliated: 'This application is not affiliated with Tesla, Inc. Tesla and the Tesla logo are trademarks of Tesla, Inc.',
      createdBy: 'Created by'
    }
  },
  'zh-TW': {
    common: {
      loading: '載入中...',
      error: '錯誤',
      cancel: '取消',
      confirm: '確認',
      retry: '重試',
      back: '返回'
    },
    header: {
      title: 'Sentinel',
      subtitle: '播放您的 Tesla 行車記錄片段'
    },
    dropZone: {
      title: '選擇 Tesla 行車記錄資料夾',
      selectButton: '選擇資料夾',
      dragAndDrop: '將 Tesla 行車記錄資料夾拖放至此或點擊瀏覽',
      clickToSelect: '點擊瀏覽並選擇 Tesla 行車記錄資料夾',
      processingFolder: '正在處理資料夾...',
      validationError: '驗證錯誤',
      failedToSelect: '選擇資料夾失敗',
      dropFolderOnly: '請拖放 Tesla 行車記錄資料夾',
      dragDropLimited: '拖放資料夾支援有限。請使用「選擇資料夾」按鈕。',
      failedToProcess: '處理拖放的資料夾失敗'
    },
    requirements: {
      title: '系統要求：',
      folderFormat: 'Tesla 行車記錄資料夾，時間戳記格式為 (YYYY-MM-DD_HH-MM-SS)',
      example: '例如，「SentryClips」資料夾中的「2025-10-20_19-52-58」資料夾',
      browserSupport: '支援所有現代瀏覽器（Chrome、Firefox、Safari、Edge）',
      demoVideoDescription: '觀看如何選擇和檢視您的 Tesla 行車記錄影片'
    },
    clipSelector: {
      title: '偵測到多個片段',
      foundClips: '在此資料夾中找到 {count} 個錄影片段。請選擇一個進行檢視：',
      selectOne: '請選擇一個進行檢視：',
      clip: '片段',
      latest: '最新',
      files: '個檔案',
      duration: '時長',
      confirmButton: '載入所選片段'
    },
    validation: {
      validating: '正在驗證資料夾...',
      analyzing: '正在分析 Tesla 行車記錄資料夾結構並驗證影片檔案...'
    },
    player: {
      processing: '正在處理 Tesla 行車記錄影片...',
      front: '前方',
      back: '後方',
      left: '左側',
      right: '右側',
      playbackRate: '播放速度',
      eventButtonText: '跳轉至事件',
      showEvent: '顯示事件資訊',
      hideEvent: '隱藏事件資訊',
      jumpToEvent: '跳轉至事件',
      rewind: '倒轉 5 秒',
      forward: '快轉 5 秒',
      play: '播放',
      pause: '暫停',
      replay: '從頭重播',
      closeClip: '關閉片段',
      debugJumpToEnd: '跳至片段結束前 3 秒（除錯）'
    },
    sidebar: {
      clipDetails: '片段詳情',
      clipInformation: '片段資訊',
      clipStart: '片段開始',
      clipEnd: '片段結束',
      totalDuration: '總時長',
      currentFootage: '目前鏡頭',
      footage: '鏡頭',
      dateTime: '日期與時間',
      duration: '時長',
      warning: '警告',
      missingCameras: '缺少攝影機畫面',
      videoFiles: '影片檔案',
      showDetails: '顯示詳情',
      closeDetails: '關閉詳情'
    },
    event: {
      title: '事件資訊',
      timestamp: '時間戳記',
      location: '位置',
      city: '城市',
      reason: '原因',
      camera: '攝影機',
      navigate: '導航至事件位置',
      viewOnOpenStreetMap: '在 OpenStreetMap 上查看',
      viewOnGoogleMaps: '在 Google 地圖上查看'
    },
    errors: {
      validationError: '驗證錯誤',
      selectDifferentFolder: '選擇其他資料夾',
      tryAgain: '重試',
      failedToLoad: '載入失敗'
    },
    disclaimer: {
      title: '隱私與安全聲明',
      privacyFirst: '🔒 所有影片處理完全在您的瀏覽器中進行。',
      noUploads: '📁 任何檔案皆不會上傳到伺服器。',
      openSource: '🔓 您可以驗證的開源程式碼。',
      understood: '我已了解',
      featuresTitle: '功能特色',
      multiCamera: '多鏡頭同步播放',
      gridView: '網格檢視或鏡頭焦點檢視',
      eventInfo: '事件資訊、位置與導航',
      browserRequirementsTitle: '瀏覽器需求',
      modernBrowser: '支援 mp4 編碼的現代瀏覽器',
      supportedBrowsers: 'Chrome、Edge、Firefox 及 Safari',
      notAffiliated: '本應用程式與 Tesla, Inc. 無任何關聯。Tesla 及 Tesla 標誌為 Tesla, Inc. 的註冊商標。',
      createdBy: '作者'
    }
  },
  'zh-CN': {
    common: {
      loading: '加载中...',
      error: '错误',
      cancel: '取消',
      confirm: '确认',
      retry: '重试',
      back: '返回'
    },
    header: {
      title: 'Sentinel',
      subtitle: '播放您的 Tesla 行车记录片段'
    },
    dropZone: {
      title: '选择 Tesla 行车记录文件夹',
      selectButton: '选择文件夹',
      dragAndDrop: '将 Tesla 行车记录文件夹拖放至此或点击浏览',
      clickToSelect: '点击浏览并选择 Tesla 行车记录文件夹',
      processingFolder: '正在处理文件夹...',
      validationError: '验证错误',
      failedToSelect: '选择文件夹失败',
      dropFolderOnly: '请拖放 Tesla 行车记录文件夹',
      dragDropLimited: '拖放文件夹支持有限。请使用"选择文件夹"按钮。',
      failedToProcess: '处理拖放的文件夹失败'
    },
    requirements: {
      title: '系统要求：',
      folderFormat: 'Tesla 行车记录文件夹，时间戳格式为 (YYYY-MM-DD_HH-MM-SS)',
      example: '例如，"SentryClips"文件夹中的"2025-10-20_19-52-58"文件夹',
      browserSupport: '支持所有现代浏览器（Chrome、Firefox、Safari、Edge）',
      demoVideoDescription: '观看如何选择和查看您的 Tesla 行车记录视频'
    },
    clipSelector: {
      title: '检测到多个片段',
      foundClips: '在此文件夹中找到 {count} 个录像片段。请选择一个进行查看：',
      selectOne: '请选择一个进行查看：',
      clip: '片段',
      latest: '最新',
      files: '个文件',
      duration: '时长',
      confirmButton: '加载所选片段'
    },
    validation: {
      validating: '正在验证文件夹...',
      analyzing: '正在分析 Tesla 行车记录文件夹结构并验证视频文件...'
    },
    player: {
      processing: '正在处理 Tesla 行车记录视频...',
      front: '前方',
      back: '后方',
      left: '左侧',
      right: '右侧',
      playbackRate: '播放速度',
      eventButtonText: '跳转至事件',
      showEvent: '显示事件信息',
      hideEvent: '隐藏事件信息',
      jumpToEvent: '跳至事件',
      rewind: '倒退 5 秒',
      forward: '快进 5 秒',
      play: '播放',
      pause: '暂停',
      replay: '从头重播',
      closeClip: '关闭片段',
      debugJumpToEnd: '跳至片段结束前 3 秒（调试）'
    },
    sidebar: {
      clipDetails: '片段详情',
      clipInformation: '片段信息',
      clipStart: '片段开始',
      clipEnd: '片段结束',
      totalDuration: '总时长',
      currentFootage: '当前镜头',
      footage: '镜头',
      dateTime: '日期与时间',
      duration: '时长',
      warning: '警告',
      missingCameras: '缺少摄像头画面',
      videoFiles: '视频文件',
      showDetails: '显示详情',
      closeDetails: '关闭详情'
    },
    event: {
      title: '事件信息',
      timestamp: '时间戳',
      location: '位置',
      city: '城市',
      reason: '原因',
      camera: '摄像头',
      navigate: '导航至事件位置',
      viewOnOpenStreetMap: '在 OpenStreetMap 上查看',
      viewOnGoogleMaps: '在 Google 地图上查看'
    },
    errors: {
      validationError: '验证错误',
      selectDifferentFolder: '选择其他文件夹',
      tryAgain: '重试',
      failedToLoad: '加载失败'
    },
    disclaimer: {
      title: '隐私与安全声明',
      privacyFirst: '🔒 所有视频处理完全在您的浏览器中进行。',
      noUploads: '📁 任何文件都不会上传到服务器。',
      openSource: '🔓 您可以验证的开源代码。',
      understood: '我已了解',
      featuresTitle: '功能特色',
      multiCamera: '多镜头同步播放',
      gridView: '网格视图或镜头焦点视图',
      eventInfo: '事件信息、位置与导航',
      browserRequirementsTitle: '浏览器要求',
      modernBrowser: '支持 mp4 编码的现代浏览器',
      supportedBrowsers: 'Chrome、Edge、Firefox 及 Safari',
      notAffiliated: '本应用程序与 Tesla, Inc. 无任何关联。Tesla 及 Tesla 标志为 Tesla, Inc. 的注册商标。',
      createdBy: '创建者'
    }
  },
  'ja': {
    common: {
      loading: '読み込み中...',
      error: 'エラー',
      cancel: 'キャンセル',
      confirm: '確認',
      retry: '再試行',
      back: '戻る'
    },
    header: {
      title: 'Sentinel',
      subtitle: 'Tesla ドライブレコーダーを再生'
    },
    dropZone: {
      title: 'Tesla ドライブレコーダーフォルダを選択',
      selectButton: 'フォルダを選択',
      dragAndDrop: 'Tesla ドライブレコーダーフォルダをここにドラッグ＆ドロップするか、クリックして選択',
      clickToSelect: 'クリックして Tesla ドライブレコーダーフォルダを選択',
      processingFolder: 'フォルダを処理中...',
      validationError: '検証エラー',
      failedToSelect: 'フォルダの選択に失敗しました',
      dropFolderOnly: 'Tesla ドライブレコーダーフォルダをドロップしてください',
      dragDropLimited: 'フォルダのドラッグ＆ドロップのサポートは限定的です。「フォルダを選択」ボタンをご使用ください。',
      failedToProcess: 'ドロップされたフォルダの処理に失敗しました'
    },
    requirements: {
      title: '要件：',
      folderFormat: 'タイムスタンプ形式（YYYY-MM-DD_HH-MM-SS）の Tesla ドライブレコーダーフォルダ',
      example: '例：「SentryClips」フォルダ内の「2025-10-20_19-52-58」フォルダ',
      browserSupport: 'すべてのモダンブラウザ（Chrome、Firefox、Safari、Edge）に対応',
      demoVideoDescription: 'Tesla ドライブレコーダー映像の選択と表示方法をご覧ください'
    },
    clipSelector: {
      title: '複数のクリップを検出',
      foundClips: 'このフォルダ内に {count} 個の録画セッションが見つかりました。1つを選択してください：',
      selectOne: '1つを選択してください：',
      clip: 'クリップ',
      latest: '最新',
      files: 'ファイル',
      duration: '長さ',
      confirmButton: '選択したクリップを読み込む'
    },
    validation: {
      validating: 'フォルダを検証中...',
      analyzing: 'Tesla ドライブレコーダーのフォルダ構造を分析し、ビデオファイルを検証しています...'
    },
    player: {
      processing: 'Tesla ドライブレコーダーの映像を処理中...',
      front: '前方',
      back: '後方',
      left: '左側',
      right: '右側',
      playbackRate: '再生速度',
      eventButtonText: 'イベント',
      showEvent: 'イベント情報を表示',
      hideEvent: 'イベント情報を非表示',
      jumpToEvent: 'イベントにジャンプ',
      rewind: '5秒巻き戻し',
      forward: '5秒早送り',
      play: '再生',
      pause: '一時停止',
      replay: '最初から再生',
      closeClip: 'クリップを閉じる',
      debugJumpToEnd: '映像終了3秒前にジャンプ（デバッグ）'
    },
    sidebar: {
      clipDetails: 'クリップ詳細',
      clipInformation: 'クリップ情報',
      clipStart: 'クリップ開始',
      clipEnd: 'クリップ終了',
      totalDuration: '合計時間',
      currentFootage: '現在の映像',
      footage: '映像',
      dateTime: '日付と時刻',
      duration: '長さ',
      warning: '警告',
      missingCameras: 'カメラ映像が不足',
      videoFiles: 'ビデオファイル',
      showDetails: '詳細を表示',
      closeDetails: '詳細を閉じる'
    },
    event: {
      title: 'イベント情報',
      timestamp: 'タイムスタンプ',
      location: '位置',
      city: '都市',
      reason: '理由',
      camera: 'カメラ',
      navigate: 'イベントの場所に移動',
      viewOnOpenStreetMap: 'OpenStreetMap で表示',
      viewOnGoogleMaps: 'Google マップで表示'
    },
    errors: {
      validationError: '検証エラー',
      selectDifferentFolder: '別のフォルダを選択',
      tryAgain: '再試行',
      failedToLoad: '読み込みに失敗しました'
    },
    disclaimer: {
      title: 'プライバシーとセキュリティに関する通知',
      privacyFirst: '🔒 すべてのビデオ処理はブラウザ内で完結します。',
      noUploads: '📁 ファイルがサーバーにアップロードされることはありません。',
      openSource: '🔓 検証可能なオープンソースコード。',
      understood: '理解しました',
      featuresTitle: '機能',
      multiCamera: 'マルチカメラ同期再生',
      gridView: 'グリッドビューまたはカメラフォーカスビュー',
      eventInfo: 'イベント情報、位置、ナビゲーション',
      browserRequirementsTitle: 'ブラウザ要件',
      modernBrowser: 'mp4 コーデックをサポートするモダンブラウザ',
      supportedBrowsers: 'Chrome、Edge、Firefox、Safari',
      notAffiliated: 'このアプリケーションは Tesla, Inc. とは関係ありません。Tesla および Tesla ロゴは Tesla, Inc. の商標です。',
      createdBy: '作成者'
    }
  }
}

// Helper function to replace placeholders in translations
export function interpolate(text: string, params: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''))
}