/**
 * Help page translations - separate from main translations to keep files manageable
 */

import type { Language } from './translations'

export interface HelpTranslations {
  title: string
  overview: {
    title: string
    text: string
  }
  features: {
    title: string
    player: string
    playerText: string
    library: string
    libraryText: string
    eventJump: string
    eventJumpText: string
    eventMap: string
    eventMapText: string
  }
  usage: {
    title: string
    step1: string
    step2: string
    step3: string
    step4: string
  }
  issues: {
    title: string
    safariTitle: string
    safari: string
  }
  links: {
    title: string
    repository: string
    issues: string
    discussions: string
  }
  back: string
  report: string
}

export const helpTranslations: Record<Language, HelpTranslations> = {
  en: {
    title: 'Help & Documentation',
    overview: {
      title: 'Overview',
      text: 'Sentinel is a Tesla dashcam viewer that runs entirely in your browser. Browse and play Recent, Saved, and Sentry clips with synchronized multi-camera playback.'
    },
    features: {
      title: 'Major Features',
      player: 'Multi-Camera Synchronized Playback',
      playerText: 'View all 4 camera angles (front, back, left, right) in sync with timeline controls and clip metadata.',
      library: 'Library View',
      libraryText: 'Browse your entire Tesla USB drive organized by categories (Recent/Saved/Sentry) and grouped by day.',
      eventJump: 'Jump to Event',
      eventJumpText: 'Quickly navigate to the exact moment when a sentry event was triggered with one click.',
      eventMap: 'Event Location Map',
      eventMapText: 'View an interactive map showing where each sentry event occurred with estimated GPS coordinates.'
    },
    usage: {
      title: 'Usage',
      step1: '1. Retrieve the USB drive from your vehicle',
      step2: '2. Find the USB root folder, usually the "TeslaCam" folder. To get best performance, you can copy the folder to local first.',
      step3: '3. Click the "Select Folder" button and open the root folder.',
      step4: '4. After finish, remember to plug the USB drive back to the vehicle.'
    },
    issues: {
      title: 'Known Issues',
      safariTitle: 'Safari Performance',
      safari: 'Safari may request video data in many small chunks, causing slow playback and stuttering. We recommend using Chrome, Edge, or Firefox for the best experience. Safari uses an ArrayBuffer buffering strategy which increases memory usage but improves performance.'
    },
    links: {
      title: 'Useful Links',
      repository: 'GitHub Repository',
      issues: 'Report an Issue',
      discussions: 'Discussions & Support'
    },
    back: 'Back to App',
    report: 'Report an Issue'
  },
  'zh-TW': {
    title: '說明與文件',
    overview: {
      title: '概述',
      text: 'Sentinel 是一個 Tesla 行車記錄器檢視器，完全在您的瀏覽器中運行。瀏覽並播放近期、已儲存和哨兵模式的片段，支援多鏡頭同步播放。'
    },
    features: {
      title: '主要功能',
      player: '多鏡頭同步播放',
      playerText: '同步檢視所有 4 個鏡頭角度（前、後、左、右），配備時間軸控制和片段詳細資訊。',
      library: '媒體庫檢視',
      libraryText: '瀏覽整個 Tesla USB 隨身碟，依類別（近期/已儲存/哨兵）組織並按日期分組。',
      eventJump: '跳轉至事件',
      eventJumpText: '一鍵快速導航至哨兵事件觸發的確切時刻。',
      eventMap: '事件位置地圖',
      eventMapText: '查看互動式地圖，顯示每個哨兵事件發生的位置及估計的 GPS 座標。'
    },
    usage: {
      title: '使用方式',
      step1: '1. 從車輛取出 USB 隨身碟',
      step2: '2. 找到 USB 根目錄資料夾，通常是「TeslaCam」資料夾。為獲得最佳效能，您可以先將資料夾複製到本機。',
      step3: '3. 點擊「選擇資料夾」按鈕並開啟根目錄資料夾。',
      step4: '4. 完成後，記得將 USB 隨身碟插回車輛。'
    },
    issues: {
      title: '已知問題',
      safariTitle: 'Safari 效能',
      safari: 'Safari 可能會以許多小區塊請求影片資料，導致播放緩慢和卡頓。我們建議使用 Chrome、Edge 或 Firefox 以獲得最佳體驗。Safari 使用 ArrayBuffer 緩衝策略，會增加記憶體使用但改善效能。'
    },
    links: {
      title: '實用連結',
      repository: 'GitHub 儲存庫',
      issues: '回報問題',
      discussions: '討論與支援'
    },
    back: '返回應用程式',
    report: '回報問題'
  },
  'zh-CN': {
    title: '帮助与文档',
    overview: {
      title: '概述',
      text: 'Sentinel 是一个 Tesla 行车记录仪查看器，完全在您的浏览器中运行。浏览并播放最近、已保存和哨兵模式的片段，支持多摄像头同步播放。'
    },
    features: {
      title: '主要功能',
      player: '多摄像头同步播放',
      playerText: '同步查看所有 4 个摄像头角度（前、后、左、右），配备时间轴控制和片段详细信息。',
      library: '媒体库视图',
      libraryText: '浏览整个 Tesla USB 驱动器，按类别（最近/已保存/哨兵）组织并按日期分组。',
      eventJump: '跳转至事件',
      eventJumpText: '一键快速导航至哨兵事件触发的确切时刻。',
      eventMap: '事件位置地图',
      eventMapText: '查看交互式地图，显示每个哨兵事件发生的位置及估计的 GPS 坐标。'
    },
    usage: {
      title: '使用方法',
      step1: '1. 从车辆取出 USB 闪存盘',
      step2: '2. 找到 USB 根目录文件夹，通常是「TeslaCam」文件夹。为获得最佳性能，您可以先将文件夹复制到本地。',
      step3: '3. 点击「选择文件夹」按钮并打开根目录文件夹。',
      step4: '4. 完成后，记得将 USB 闪存盘插回车辆。'
    },
    issues: {
      title: '已知问题',
      safariTitle: 'Safari 性能',
      safari: 'Safari 可能会以许多小块请求视频数据，导致播放缓慢和卡顿。我们建议使用 Chrome、Edge 或 Firefox 以获得最佳体验。Safari 使用 ArrayBuffer 缓冲策略，会增加内存使用但改善性能。'
    },
    links: {
      title: '实用链接',
      repository: 'GitHub 仓库',
      issues: '报告问题',
      discussions: '讨论与支持'
    },
    back: '返回应用程序',
    report: '报告问题'
  },
  ja: {
    title: 'ヘルプとドキュメント',
    overview: {
      title: '概要',
      text: 'Sentinel は、ブラウザ内で完全に動作する Tesla ドライブレコーダービューアーです。最近、保存済み、セントリーモードのクリップを閲覧し、マルチカメラ同期再生で視聴できます。'
    },
    features: {
      title: '主な機能',
      player: 'マルチカメラ同期再生',
      playerText: 'すべての 4 つのカメラアングル（前、後、左、右）を同期して表示し、タイムラインコントロールとクリップメタデータを備えています。',
      library: 'ライブラリビュー',
      libraryText: 'カテゴリ（最近/保存済み/セントリー）ごとに整理され、日付でグループ化された Tesla USB ドライブ全体を閲覧できます。',
      eventJump: 'イベントへジャンプ',
      eventJumpText: 'セントリーイベントがトリガーされた正確な瞬間にワンクリックで素早く移動できます。',
      eventMap: 'イベント位置マップ',
      eventMapText: '各センサーイベントが発生した場所を推定GPS座標とともに示すインタラクティブマップを表示します。'
    },
    usage: {
      title: '使用方法',
      step1: '1. 車両からUSBドライブを取り出します',
      step2: '2. USBのルートフォルダ、通常は「TeslaCam」フォルダを見つけます。最高のパフォーマンスを得るために、最初にフォルダをローカルにコピーすることができます。',
      step3: '3. 「フォルダを選択」ボタンをクリックして、ルートフォルダを開きます。',
      step4: '4. 完了したら、USBドライブを車両に戻すことを忘れないでください。'
    },
    issues: {
      title: '既知の問題',
      safariTitle: 'Safari のパフォーマンス',
      safari: 'Safari は動画データを多数の小さなチャンクでリクエストするため、再生が遅くなったり、カクつくことがあります。最高のエクスペリエンスには Chrome、Edge、または Firefox の使用をお勧めします。Safari は ArrayBuffer バッファリング戦略を使用し、メモリ使用量が増加しますがパフォーマンスが向上します。'
    },
    links: {
      title: '便利なリンク',
      repository: 'GitHub リポジトリ',
      issues: '問題を報告',
      discussions: 'ディスカッションとサポート'
    },
    back: 'アプリに戻る',
    report: '問題を報告'
  }
}
