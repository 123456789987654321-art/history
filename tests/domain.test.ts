import {describe,it,expect} from 'vitest';
import {canExport,compose,invalidate,styles,type Session} from '../server/domain';
describe('讲解与导出边界',()=>{
 it('三种语体均拒绝未知史实且拒绝任意模型文本',()=>{for(const style of styles){expect(compose(style,[0,1,2])).toContain('示意');expect(()=>compose(style,[0,0,1])).toThrow();expect(()=>compose(style,'商代')).toThrow();expect(()=>compose(style,[0,1,3])).toThrow();}});
 it('重新生成或调整使人工确认失效',()=>{const s:Session={id:'test',revision:1,confirmedRevision:1,typeConfirmed:true,draft:{id:'draft',style:styles[0],text:'test',mode:'offline',model:'local',prompt:''},logs:[]};expect(canExport(s)).toBe(true);invalidate(s);expect(s.confirmedRevision).toBeNull();expect(canExport(s)).toBe(false);});
});
