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

if (!icsPath) {
  if (fs.existsSync(outputPath)) {
    console.log('ℹ️ 未偵測到新的 airbnb-calendar.ics 實體檔案，沿用現有 availability.json 房態資料。');
    process.exit(0);
  } else {
    console.error('❌ 找不到 airbnb-calendar.ics 且無現有 availability.json 檔案！');
    process.exit(1);
  }
}

console.log(`📖 讀取 iCal 來源檔案: ${icsPath}`);
const content = fs.readFileSync(icsPath, 'utf8');

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
    const summary = summaryMatch ? summaryMatch[1].trim() : 'Airbnb Reserved';
    const uid = uidMatch ? uidMatch[1].trim() : '';
    const isReserved = summary.toLowerCase().includes('reserved');

    events.push({
      startDate,
      endDate,
      source: 'Airbnb',
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
  syncSource: path.basename(icsPath),
  syncStatus: 'healthy',
  totalEvents: events.length,
  bookedRanges: events
};

fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

console.log(`✅ 成功解析 ${events.length} 組 Airbnb 檔期事件！`);
console.log(`💾 已更新房態資料檔: ${outputPath}`);
events.forEach((ev, idx) => {
  console.log(`  [${String(idx + 1).padStart(2, '0')}] ${ev.startDate} ~ ${ev.endDate} | ${ev.type.toUpperCase().padEnd(8)} | ${ev.summary}`);
});
