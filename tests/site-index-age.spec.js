import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { startStaticServer } from "./static-server.mjs";
import { SI_AGE_ADDITIONS, yearsToBHForSI, solveSIWithAgeAddition, sluHeightAtAge, calculateFieldSI } from "../js/calculators/fieldSiteIndex.js";

test("SI-beroende år till BH: verifierade tabeller, interpolation utan klippning", () => {
  expect(SI_AGE_ADDITIONS.tall).toEqual([[14,14],[16,12],[18,10],[20,9],[22,9],[24,8],[26,8],[28,8]]);
  expect(SI_AGE_ADDITIONS.gran).toEqual([[16,13],[18,12],[20,11],[22,10],[24,10],[26,9],[28,9],[30,8],[32,8]]);
  expect(yearsToBHForSI("tall", 15)).toBe(13);
  expect(yearsToBHForSI("gran", 29)).toBe(8.5);
  for (const [species, si] of [["tall",13.9],["tall",28.1],["gran",15.9],["gran",32.1],["bjork",20],["tall",NaN]]) expect(yearsToBHForSI(species,si)).toBeNull();
});

test("SI och ålderstillägg löser samma samband för båda trädslagen", () => {
  let checked = 0;
  for (const [species, rows] of Object.entries(SI_AGE_ADDITIONS)) {
    for (let si = rows[0][0]; si <= rows.at(-1)[0]; si += 0.25) {
      for (const age of [15,30,60,80,120]) {
        const addition = yearsToBHForSI(species,si);
        const height = sluHeightAtAge(species,si,100,age+addition);
        if (height <= 5) continue;
        const solved = solveSIWithAgeAddition(species,height,age);
        expect(solved).not.toBeNull();
        expect(solved.si).toBeCloseTo(si,7);
        expect(solved.totalAge).toBeCloseTo(age+addition,7);
        expect(sluHeightAtAge(species,height,solved.totalAge)).toBeCloseTo(solved.si,8);
        checked++;
      }
    }
  }
  expect(checked).toBeGreaterThan(400);
  const output = calculateFieldSI({ species:"tall", ageAdditionMode:"regional", trees:[{height:16,age:60}] });
  expect(output).toMatchObject({ hasSI:true, totalAgeLow:69, totalAgeHigh:69, ageSource:"bd-bh-tabell.1" });
  expect(output.siLow).toBeCloseTo(20.36157701373969,10);
});

test("känd totalålder, regional begränsning och förslag utan påhittade gränsvärden", () => {
  const input = { species:"tall", ageAdditionMode:"measured", trees:[{height:16,age:60,totalAge:69},{height:17,age:61,totalAge:72}] };
  const output = calculateFieldSI(input);
  expect(output.hasSI).toBe(true);
  expect(output.totalAgeLow).toBe(70.5);
  expect(output.siLow).toBeCloseTo((sluHeightAtAge("tall",16,69)+sluHeightAtAge("tall",17,72))/2,12);
  for (const totalAge of ["",60,59,69.5,"69x",Infinity]) expect(calculateFieldSI({ ...input, trees:[{height:16,age:60,totalAge}] }).error).toBeTruthy();
  expect(calculateFieldSI({ species:"gran", region:"other", ageAdditionMode:"regional", trees:[{height:16,age:60}] }).error).toContain("norra Sverige");
  for (const height of [4,120]) expect(calculateFieldSI({species:"tall",ageAdditionMode:"regional",trees:[{height,age:60}]}).error).toContain("ingen entydig matchning");
  const old = { species:"tall", ageAdditionMode:"regional", trees:[{height:20,age:90}] };
  expect(calculateFieldSI(old)).toMatchObject({ hasSI:false, suggestion:null });
  expect(calculateFieldSI({...old,allowExtrapolation:true})).toMatchObject({ hasSI:false, suggestion:{confidence:"Låg",extrapolated:true} });
  expect(calculateFieldSI({...old,suitability:"unsuitable",allowExtrapolation:true})).toMatchObject({ hasSI:false,suggestion:null });
  expect(calculateFieldSI({...input,species:"bjork"}).error).toBeTruthy();
});

let server;
test.beforeAll(async () => { server = await startStaticServer({port:4182}); });
test.afterAll(async () => { await server?.close(); });

for (const width of [390,1440]) {
  test(`SI-anpassat fältläge ${width}px: matchning, fyra träd, totalålder och rådata`, async ({page}) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", msg => { if (msg.type()==="error") errors.push(msg.text()); });
    await page.setViewportSize({width,height:width===390?844:900});
    await page.goto(`${server.url}/?test=1#/field-notes`);
    await page.getByRole("button",{name:"Ny avdelning",exact:true}).click();
    await page.getByLabel("Avdelning",{exact:true}).fill("SI-24");
    await page.getByRole("link",{name:"SI i avdelningen",exact:true}).click();
    await expect(page.locator('[name="ageAdditionMode"]')).toHaveValue("regional");
    await page.getByLabel("Höjd träd 1",{exact:true}).fill("16,0");
    await page.getByLabel("BH-ålder träd 1",{exact:true}).fill("60");
    await expect(page.getByLabel("Totalålder träd 1",{exact:true})).toBeHidden();
    await page.getByRole("button",{name:"Beräkna SI och totalålder",exact:true}).click();
    await expect(page.locator("[data-si-result]")).toContainText("T20,4");
    await expect(page.locator("[data-total-age]")).toContainText("69,0");
    await expect(page.locator("[data-si-match]")).toContainText("T20");
    expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({path: `test-results/screenshots/si-regional-${width}.png`,fullPage:true});
    await page.getByRole("button",{name:"Spara resultat",exact:true}).click();
    for (let i=2;i<=4;i++) {
      await page.getByRole("button",{name:"Lägg till provträd",exact:true}).click();
      await page.getByLabel(`Höjd träd ${i}`,{exact:true}).fill("16");
      await page.getByLabel(`BH-ålder träd ${i}`,{exact:true}).fill("60");
    }
    await page.locator('[name="ageAdditionMode"]').selectOption("measured");
    for (let i=1;i<=4;i++) await page.getByLabel(`Totalålder träd ${i}`,{exact:true}).fill(String(68+i));
    await page.getByRole("button",{name:"Beräkna SI och totalålder",exact:true}).click();
    await expect(page.locator("[data-total-age]")).toContainText("70,5");
    await expect(page.locator("[data-si-result]")).toContainText("känd totalålder");
    expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({path:`test-results/screenshots/si-matching-${width}.png`,fullPage:true});
    await page.reload();
    await expect(page.getByLabel("Totalålder träd 4",{exact:true})).toHaveValue("72");
    await page.getByRole("button",{name:"Beräkna SI och totalålder",exact:true}).click();
    await page.getByRole("button",{name:"Spara resultat",exact:true}).click();
    await page.goto(`${server.url}/?test=1#/field-notes`);
    const downloaded = page.waitForEvent("download");
    await page.getByRole("button",{name:"Säkerhetskopia",exact:true}).click();
    const backup = JSON.parse(readFileSync(await (await downloaded).path(),"utf8"));
    expect(backup.entries[0].measurements).toHaveLength(2);
    expect(backup.entries[0].measurements[0].assessment.siLow).toBeCloseTo(20.36157701373969,10);
    expect(backup.entries[0].measurements[1].input.trees).toHaveLength(4);
    expect(backup.entries[0].text).toContain("regionalt schablontillägg");
    expect(errors).toEqual([]);
  });
}
