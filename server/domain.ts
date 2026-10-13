export const styles = ['青少年科普','专业导览','器物自述'] as const;
export type Style = typeof styles[number];
export const disclosure = '器型示意，非考古复原。照片仅为主视面投影；其余为程序几何推定。未鉴定具体文物，年代、出土信息、尺寸重量、纹饰和铭文均未核验。';
export const facts = [
  {field:'示意结构',value:'双立耳、长方形鼎腹、四足',source:'项目参数化几何定义 src/viewer.ts（模型信息，非文物史实）',status:'模型定义'},
  ...['文物名称','年代','出土信息','现藏地','尺寸与重量','纹饰与铭文','铸造工艺'].map(field=>({field,value:'未核验',source:'无已核验来源',status:'未核验'}))
];
export const passages:Record<Style,string[]> = {
  '青少年科普':['先看看这件方鼎示意模型：上面是两只立耳，中间是鼎腹，下面是四只足。','试着拆开它，观察三个部分；上传的照片只覆盖你选择的主视面。','我们还不知道照片里是哪件文物。它的年代和故事，需要找到可靠来源再讲。'],
  '专业导览':['本展项为参数化方鼎器型示意，结构分为双立耳、长方形鼎腹与四足。','主视面采用用户照片投影，未拍摄区域使用程序几何推定，不代表真实深度与纹饰。','器类选择不构成文物鉴定；名称、年代、出土信息等字段未核验，不作史实陈述。'],
  '器物自述':['我是你正在调整的方鼎示意模型，双耳、鼎腹和四足组成了我的轮廓。','你可以为我的一面贴上照片，但我的另一面仍然只是几何推定。','我暂时没有经过核实的身份，也不会编造自己的年代与经历。请带着来源，再来认识照片里的文物。']
};
export type Entry={at:string;action:string;detail:unknown};
export type Session={id:string;revision:number;confirmedRevision:number|null;typeConfirmed:boolean;draft:null|{id:string;style:Style;text:string;mode:string;model:string;prompt:string};logs:Entry[]};
export function invalidate(s:Session){s.revision++;s.confirmedRevision=null;}
export function canExport(s:Session){return s.typeConfirmed && !!s.draft && s.confirmedRevision===s.revision;}
// Online model may select only supplied, immutable sentences. No free-form facts enter display.
export function compose(style:Style,ids:unknown):string {
  if(!Array.isArray(ids)||ids.length!==3||new Set(ids).size!==3||!ids.every(n=>Number.isInteger(n)&&n>=0&&n<3))throw new Error('模型返回不符合受限讲解格式');
  return ids.map(n=>passages[style][n]).join('\n\n');
}
