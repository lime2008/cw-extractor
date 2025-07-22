import { extractWidgetInfo } from './extractor';
import * as fs from 'fs';

// 从文件读取控件代码
const widgetCode = fs.readFileSync('./test-widget.js', 'utf-8');
//const widgetCode = `

//`

try {
  const widgetInfo = extractWidgetInfo(widgetCode);
  console.log('成功提取控件信息:');
  console.log(widgetInfo);
} catch (error) {
  console.error('提取控件信息失败:');
  console.error(error instanceof Error ? error.message : error);
}