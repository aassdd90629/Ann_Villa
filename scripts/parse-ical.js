import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 支援讀取專案內或工作區根目錄的 calendar.ics
const potentialPaths = [
  path.resolve(__dirname, '../calendar.ics'),
  path.resolve(__dirname, '../../calendar.ics')
];

let icsPath = potentialPaths.find(p => fs.existsSync(p));

async function main() {
  if (!icsPath) {
    console.log('ℹ️ 外部 iCal 同步已停用，房態以自營直訂與管家自主關閉為主。');
    process.exit(0);
  }

  console.log(`📖 讀取本機 iCal 來源檔案: ${icsPath}`);
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
      const summary = summaryMatch ? summaryMatch[1].trim() : 'Reserved';
      const uid = uidMatch ? uidMatch[1].trim() : `${startDate}_${endDate}@external.com`;
      const isReserved = summary.toLowerCase().includes('reserved');

      events.push({
        startDate,
        endDate,
        source: 'EXTERNAL',
        type: isReserved ? 'reserved' : 'blocked',
        status: 'confirmed',
        summary,
        uid
      });
    }
  }

  events.sort((a, b) => a.startDate.localeCompare(b.startDate));
  console.log(`✅ 成功解析 ${events.length} 組外部檔期事件！`);
}

main().catch(console.error);
