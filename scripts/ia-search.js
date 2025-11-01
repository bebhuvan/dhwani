#!/usr/bin/env node
/**
 * Internet Archive Advanced Search helper
 * Usage:
 *   node scripts/ia-search.js "query string" [--rows 50]
 *
 * Prints TSV: year\tidentifier\ttitle
 */
import https from 'https';

function get(url){
  return new Promise((resolve,reject)=>{
    https.get(url,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve(JSON.parse(d))}catch(e){reject(e)}}).on('error',reject)});
  });
}

async function main(){
  const args=process.argv.slice(2);
  if(!args.length){
    console.error('Usage: node scripts/ia-search.js "query" [--rows 50]');
    process.exit(1);
  }
  const q=args[0];
  const rowsArg=args.includes('--rows')? parseInt(args[args.indexOf('--rows')+1]||'50',10):50;
  const fields=['identifier','title','year','date','creator','collection'];
  const url=`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&output=json&rows=${rowsArg}&page=1&fields=${encodeURIComponent(fields.join(','))}`;
  try{
    const json=await get(url);
    const docs=json?.response?.docs||[];
    for(const d of docs){
      const y=(d.year||d.date||'').toString();
      console.log(`${y}\t${d.identifier}\t${d.title}`);
    }
  }catch(e){
    console.error('IA search failed:', e.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();

