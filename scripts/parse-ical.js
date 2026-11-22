import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 支援讀取專案內或工作區根目錄的 airbnb-calendar.ics
const potentialPaths = [
  path.resolve(__dirname, '../airbnb-calendar.ics'),
  path.resolve(__dirname, '../../airbnb-calendar.ics')
];

let icsPath = potentialPaths.find(p => fs.existsSync(p));
const outputPath = path.resolve(__dirname, '../src/data/availability.json');
const wranglerPath = path.resolve(__dirname, '../wrangler.toml');

// 嘗試自 wrangler.toml 提取 AIRBNB_ICAL_URL
function getAirbnbUrl() {
  if (process.env.AIRBNB_ICAL_URL) return process.env.AIRBNB_ICAL_URL;
  if (fs.existsSync(wranglerPath)) {
    const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
    const match = wranglerContent.match(/AIRBNB_ICAL_URL\s*=\s*["']([^"']+)["']/);
    if (match && match[1] && !match[1].includes('xxxx.ics')) {
      return match[1];
    }
  }
  return null;
}

async function main() {
  const airbnbUrl = getAirbnbUrl();
  let content = null;

  // 若有提供 URL，優先嘗試網路即時抓取 (超時 5 秒)
  if (airbnbUrl) {
    try {
      console.log(`🌐 嘗試自 Airbnb 即時拉取: ${airbnbUrl.substring(0, 55)}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(airbnbUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ShanyuVillaBot/1.0; +https://ann-villa.pages.dev)'
        }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        content = await res.text();
        console.log('✅ 成功從 Airbnb 取得最新日曆！');
        // 自動同步回寫至 local airbnb-calendar.ics 備份
        if (icsPath) {
          fs.writeFileSync(icsPath, content, 'utf8');
          console.log(`💾 已自動回寫備份至: ${icsPath}`);
        }
      }
    } catch (netErr) {
      console.info('ℹ️ 網路拉取跳過或離線 (使用本機快照檔案):', netErr.message);
    }
  }

  // 若網路抓取未成功，退回讀取本機快照
  if (!content) {
    if (!icsPath) {
      if (fs.existsSync(outputPath)) {
        console.log('ℹ️ 未偵測到 airbnb-calendar.ics 實體檔案，沿用現有 availability.json 房態資料。');
        process.exit(0);
      } else {
        console.error('❌ 找不到 airbnb-calendar.ics 且無現有 availability.json 檔案！');
        process.exit(1);
      }
    }
    console.log(`📖 讀取本機 iCal 來源檔案: ${icsPath}`);
    content = fs.readFileSync(icsPath, 'utf8');
  }

  const events = [];
  const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let match;

  while ((match = eventRegex.exec(content)) !== null) {
    const block = match[1];
    const dtstartMatch = block.match(/DTSTART(?:;VALUE=DATE)?:(\d{4})(\d{2})(\d{2})/);
    const dtendMatch = block.match(/DTEND(?:;VALUE=DATE)?:(\d{4})(\d{2})(\d{2})/);
    const summaryMatch = block.match(/SUMMARY:(.*)/);
    const uidMatch = block.match(/UID:(.*)/);

    if (dtstartMatch && dtendMatch) {
      const startDate = `${dtstartMatch[1]}-${dtstartMatch[2]}-${dtstartMatch[3]}`;
      const endDate = `${dtendMatch[1]}-${dtendMatch[2]}-${dtendMatch[3]}`;
      const summary = summaryMatch ? summaryMatch[1].trim() : 'Reserved';
      const uid = uidMatch ? uidMatch[1].trim() : `${startDate}_${endDate}@airbnb.com`;
      const isReserved = summary.toLowerCase().includes('reserved');

      events.push({
        startDate,
        endDate,
        source: 'AIRBNB',
        type: isReserved ? 'reserved' : 'blocked',
        status: 'confirmed',
        summary,
        uid
      });
    }
  }

  // 依日期排序
  events.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const outputData = {
    lastSyncedAt: new Date().toISOString(),
    syncSource: airbnbUrl ? 'Airbnb iCal Feed' : (icsPath ? path.basename(icsPath) : 'local'),
    syncStatus: 'healthy',
    totalEvents: events.length,
    bookedRanges: events
  };

  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

  console.log(`✅ 成功解析 ${events.length} 組 Airbnb 檔期事件！`);
  console.log(`💾 已更新房態資料檔: ${outputPath}`);
  events.forEach((ev, idx) => {
    console.log(`  [${String(idx + 1).padStart(2, '0')}] ${ev.startDate} ~ ${ev.endDate} | ${ev.type.toUpperCase().padEnd(8)} | ${ev.summary}`);
  });
}

main().catch(err => {
  console.error('執行失敗:', err);
  process.exit(1);
});
