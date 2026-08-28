/**
 * 将 electron-updater / 主进程返回的更新相关英文与原始错误，转为与界面语言一致、面向非技术用户的短说明。
 */
export function formatUpdateError(raw: string | null | undefined, lang: 'zh' | 'en'): string {
  if (raw == null || String(raw).trim() === '') {
    return ''
  }
  const s = String(raw)
  const low = s.toLowerCase()

  if (s.includes('开发模式') && (s.includes('无法检查') || s.includes('无法下载') || s.includes('无法安装'))) {
    return lang === 'en'
      ? 'Auto-update is only available in the installed app, not in development mode.'
      : '自动更新仅适用于已安装版本；当前为开发/调试方式打开，无法使用。'
  }

  if (s.includes('当前环境不支持自动更新') || s.includes('浏览器环境下')) {
    return lang === 'en'
      ? 'Updates are not available in this view. Please use the installed desktop app.'
      : '当前无法使用自动更新，请通过已安装的本软件桌面版重试。'
  }

  if (s.includes('No published versions on GitHub') || low.includes('err_updater_no_published')) {
    return lang === 'en'
      ? 'No GitHub Release with installer + latest.yml yet. Create a Release and upload electron-builder artifacts, or publish with --publish.'
      : '未找到已发布的安装包与更新元数据（如 latest.yml）。请由维护方完成 Releases 上传或使用规范方式发布后再试。'
  }

  if (low.includes('err_updater_channel_file_not_found') || (s.includes('Cannot find') && s.includes('latest') && s.includes('yml'))) {
    return lang === 'en'
      ? "The update description file is missing from the release. Please retry after a complete publish."
      : '新版本发布中缺少更新说明文件。请让维护人员按规范重新上传完整发布文件后再试。'
  }

  if (low.includes('err_updater_invalid_release_feed') || s.includes('Cannot parse releases feed')) {
    return lang === 'en'
      ? "We couldn't read the update list from the server. Please try again later or contact your administrator."
      : '无法正确读取更新列表。请稍后再试，或联系软件维护方。'
  }

  if (low.includes('err_updater_invalid_update_info')) {
    return lang === 'en'
      ? 'The update information on the server looks invalid. Please try again later or contact support.'
      : '服务器上的更新信息异常，请稍后再试或联系维护人员。'
  }

  if (
    low.includes('econnrefused') ||
    low.includes('etimedout') ||
    low.includes('enotfound') ||
    low.includes('econnreset') ||
    low.includes('network request failed') ||
    low.includes('getaddrinfo') ||
    low.includes('net::err_') ||
    low.includes('networkerror') ||
    s.includes('socket hang up') ||
    s.includes('fetch failed')
  ) {
    return lang === 'en'
      ? "We couldn't reach the update service. Check your network, or contact IT on restricted networks."
      : '无法连上更新服务。请检查网络；若单位网络有限制，可联系信息化管理人员。'
  }

  if (
    low.includes(' 404') ||
    low.includes('statuscode":404') ||
    low.includes('statuscode: 404') ||
    low.includes('http error 404') ||
    s.includes('(404)')
  ) {
    if (s.includes('authentication') || s.includes('token') || s.includes('double check')) {
      return lang === 'en'
        ? "We couldn't read the update page—access may be restricted. Contact your app team."
        : '无法访问发布页，可能被权限或网络策略限制。请与维护方确认。'
    }
    const likeDownload = low.includes('download') || low.includes('releases/') || low.includes('assets/')
    if (likeDownload) {
      return lang === 'en'
        ? 'The installer file was not found (404). Re-upload the exact files from the same electron-builder output.'
        : '下载安装包失败（404）。请使用与 latest.yml 同批生成的安装文件原样上传，勿随意改名。'
    }
    return lang === 'en'
      ? "The update information wasn't found (404). The new version may not be published yet."
      : '未找到更新信息（404）。可能尚未发布新版本，或发布地址已变更。'
  }

  if (low.includes(' 403') || low.includes(' 401') || s.includes('forbidden')) {
    return lang === 'en'
      ? 'Access to the update was blocked. Try another network or ask IT support.'
      : '没有权限拉取更新。可更换网络或联系单位信息化/维护方。'
  }

  if (s.includes('GitHub') && s.includes("couldn't find")) {
    return lang === 'en'
      ? "We couldn't find the update on the release service. Try again after a new release is published."
      : '在发布服务上未找到可用更新。待维护方发布新版本后再试。'
  }

  return lang === 'en'
    ? "We couldn't complete the update check. Please try again later or contact support."
    : '暂时无法完成检查。请稍后再试，或联系本单位软件/信息化支持人员。'
}
