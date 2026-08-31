# 鐘樓光景 — Three.js / GLB

單張插畫的程序化近似重建。**本輪完成 GLB 技術驗收及效能最佳化；原圖校色驗收仍未完成，沒有放寬色差門檻。**

## 模型與啟動

- 模型：`public/models/chaoyang-clocktower-campus.glb`，15,868,868 bytes（約 15.1 MiB）。
- 62 個具名組件、34 張內嵌圖片；沒有外部圖片或 buffer 依賴。
- Y 軸向上，尺寸為推估場景單位，非測繪公尺。
- 保留樞紐、組件 ID、socket 及 actionProfile 的碰撞意圖；不包含物理引擎或骨架動畫。

```powershell
npm ci
npm run dev
```

[互動預覽](http://127.0.0.1:5178/) · [直接載入 GLB](http://127.0.0.1:5178/?asset=glb)

拖曳旋轉、滾輪縮放、點選組件；右側可切換角度、光線、拆解及下載 GLB。匯出使用原始組裝姿態，不受目前旋轉或拆解程度影響，也不改動畫面狀態。

## 驗收結果

| 指標 | 最佳化前 | 最佳化後 |
|---|---:|---:|
| 預覽三角形（含地面、文字） | 385,008 | 211,656（−45.0%） |
| 預覽 draw calls | 2,935 | 157（−94.7%） |
| 實機平均 FPS | 31.6 | 121.4 |
| 中位幀時間 | 31.5 ms | 8.0 ms |

幀率條件：相同電腦及瀏覽器，1280×720、DPR 1.5，預熱後量測 180 幀；不是所有裝置的效能保證。靜止狀態採按需渲染，測試期間渲染次數不變。

- Khronos glTF Validator：**0 errors / 0 warnings**；另有提示層級訊息，包含保留的空 socket、未使用 UV 與非 2 次方校名貼圖。
- GLB 重載：211,654 個模型三角形、156 個網格、21 個材質、62 個組件；邊界誤差 0。
- 實際下載檔亦通過驗證，組件及原始組裝姿態與交付檔一致。二進位 hash 可能因匯出排列不同而不同，不宣稱逐 byte 相同。
- 最佳化前後輪廓 IoU：0.9941；內部差異 0.01624。
- 原生模型與重載 GLB 輪廓 IoU：0.9994；內部差異 0.000523。
- 四向 GLB、組件覆蓋、點選、拆解復位、匯出不改動畫面、型別檢查與 build 通過。

影像指標比較的是**最佳化前後／GLB 往返**，不是與原始插畫的相似度。

## 實作與重現

- `src/createCampusModel.ts`：模型工廠；`{optimize:false}` 可重建未最佳化基準。
- `src/modelDelivery.ts`：同組件＋材質批次合併、頂點去重、明確 tangent frame、無循環參照的匯出樹。
- `src/main.ts`：按需渲染、點選、拆解、GLB 重載與匯出。
- `object-sculpt-spec.json`：`technicalDelivery` 記錄本輪工作，原視覺審查紀錄保留。
- `evidence/delivery/`：標準驗證、實機幀率、GLB 往返、UI 測試及五個 GLB 視角。

```powershell
npm run build
npm test
python review_delivery.py
```

`npm test` 驗證模型結構、效能預算、點選及現有 GLB。影像檢查使用已保存的真實截圖。

重新產生可攜檔：啟動 dev server，開啟 `http://127.0.0.1:5178/?verify=1` 並按「執行 GLB 驗收」。往返檢查成功後才儲存至固定模型路徑。儲存端點僅存在於本機開發伺服器，限制同源、固定路徑與 50 MiB。一般下載按鈕在靜態部署也能使用，不需要此端點。

## 限制

- 原校色檢查仍未通過：先前色差 24.27，門檻 20。背面、植栽、窗框及底座為簡化推估。
- **不是布林聯集或封閉的 3D 列印網格**。瓦縫、框線及樹冠有建模交疊；合併後自交抽樣仍有命中，結果保留於 `self-intersection.json`，不宣稱通過無自交驗收。
- 組件覆蓋證明規格所列組件已建造，不代表原圖所有細節精確重現。
- 校名重新排字，太陽圖樣簡化重畫，非官方標誌向量檔。
- Vite 已更新至 7.3.6；最後 npm audit 為 0 vulnerabilities。

不要重跑 `author_spec.py` 覆蓋後續修正；續做視覺重建前仍應執行儲存庫根目錄的 `python forge/next.py --state .img2threejs/state.json campus/object-sculpt-spec.json`。
