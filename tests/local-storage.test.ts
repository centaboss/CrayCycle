import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { db, removeDemoData, snapshot } from '../src/lib/db';
import { seedDemoData, ensureSettings } from '../src/lib/seed';

describe('offline database and demo cleanup',()=>{
  beforeEach(async()=>{await db.open();await Promise.all(db.tables.map(t=>t.clear()));await ensureSettings();});
  afterAll(async()=>{db.close();});
  it('persists records to IndexedDB without server calls',async()=>{
    await db.tanks.add({id:'user-tank',name:'My tank'});
    await db.breeders.add({id:'user-breeder',code:'OWN-01',nickname:'My female',species:'Cherax quadricarinatus',tankId:'user-tank',registeredOn:'2026-10-01',notes:''});
    const s=await snapshot();
    expect(s.breeders.map(b=>b.code)).toContain('OWN-01');
    db.close();await db.open();
    expect((await db.breeders.get('user-breeder'))?.nickname).toBe('My female');
  });
  it('regenerating demos does not erase real user records, even when linked to a demo breeder',async()=>{
    await seedDemoData();
    await db.cycles.add({id:'personal-cycle',breederId:'demo-breeder-1',status:'active',pairingOn:'2026-10-01',notes:'Mine'});
    await db.tasks.add({id:'personal-task',breederId:'demo-breeder-1',cycleId:'demo-cycle-1',title:'Own observation',dueOn:'2026-11-01',priority:'normal',status:'pending',notes:''});
    await removeDemoData();
    expect(await db.cycles.get('personal-cycle')).toBeDefined();
    expect(await db.tasks.get('personal-task')).toBeDefined();
    expect(await db.cycles.get('demo-cycle-1')).toBeDefined();
    expect(await db.breeders.get('demo-breeder-1')).toBeDefined();
    await seedDemoData();
    expect(await db.cycles.get('personal-cycle')).toBeDefined();
  });
});
