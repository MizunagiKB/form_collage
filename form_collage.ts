// ===========================================================================
/*!
 * @brief uniForm Collage
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./DefinitelyTyped/jquery/jquery.d.ts"/>
/// <reference path="./DefinitelyTyped/pixijs/pixijs.d.ts"/>


module form_collage {
    // ------------------------------------------------------------ declare(s)
    // --------------------------------------------------------------- enum(s)
    enum E_LAYER {
        WEAR_FORE = 0,
        BODY_FORE,
        WEAR_BASE,
        BODY_BASE,
        WEAR_BACK,
        BODY_BACK,
        BG,
        MAX
    }

    // ---------------------------------------------------------- interface(s)
    interface ICOLLAGE_POS {
        x: number;
        y: number;
    }

    interface ICOLLAGE_IMAGE {
        layer: string;
        src: string;
    }

    interface ICOLLAGE_ITEM {
        pos: ICOLLAGE_POS;
        movable: boolean;
        priority: number;
        images: Array<ICOLLAGE_IMAGE>;
    }

    interface ICOLLAGE_BODY {
        items: Array<ICOLLAGE_ITEM>;
    }

    interface ICOLLAGE_WEAR {
        items: Array<ICOLLAGE_ITEM>;
    }

    interface ICOLLAGE {
        textures: Array<string>;
        name: string;
        pos: ICOLLAGE_POS;
        body: ICOLLAGE_BODY;
        wear: ICOLLAGE_WEAR;
    }

    // ------------------------------------------------------------- global(s)
    // -------------------------------------------------------------- param(s)
    const SCREEN_W: number = 1024;
    const SCREEN_H: number = 768;
    const SNAP_REGION: number = 32;
    const DRAGGABLE_ALPHA: number = 32;
    // -------------------------------------------------------------- class(s)
    // -----------------------------------------------------------------------
    /*!
     */
    class CFormSprite extends PIXI.Sprite {
        m_nGroupIdx: number = 0;
        m_bMovable: boolean = false;
        m_nPriority: number = 0;

        spr_hittest(posWorld: PIXI.Point): boolean {
            if (posWorld.x < this.x + this.texture.trim.x) return (false);
            if (posWorld.y < this.y + this.texture.trim.y) return (false);
            if (posWorld.x > this.x + this.texture.trim.x + this.texture.crop.width) return (false);
            if (posWorld.y > this.y + this.texture.trim.y + this.texture.crop.height) return (false);

            return (true);
        }

        tex_hittest(posWorld: PIXI.Point): boolean {
            let posLocal: PIXI.Point = new PIXI.Point(
                posWorld.x - this.x,
                posWorld.y - this.y
            );
            let oCCanvas = document.createElement("canvas");
            let oCContext = oCCanvas.getContext("2d");

            oCCanvas.width = this.texture.baseTexture.source.width;
            oCCanvas.height = this.texture.baseTexture.source.height;

            oCContext.drawImage(
                this.texture.baseTexture.source,
                0, 0
            );

            let aryImage = oCContext.getImageData(0, 0, oCCanvas.width, oCCanvas.height).data;

            let sampleAddress: number = 0;
            sampleAddress += (oCCanvas.width * 4 * (this.texture.frame.y + (posLocal.y - this.texture.trim.y)));
            sampleAddress += ((this.texture.frame.x + (posLocal.x - this.texture.trim.x)) * 4);
            sampleAddress += 3;

            return (aryImage[sampleAddress] > DRAGGABLE_ALPHA);
        }
    }

    // -----------------------------------------------------------------------
    /*!
     */
    export class CMainFrame {
        static INSTANCE: CMainFrame = null;

        m_oCRenderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer = null;
        m_oCContainer: PIXI.Container = null;
        m_listLayer: Array<Array<CFormSprite>> = [];
        m_listGroup: Array<Array<CFormSprite>> = [];
        m_nGroupCount: number = 0;

        m_oCCollage: ICOLLAGE = null;

        m_evtDragging: boolean = false;
        m_evtDraggingGroup: number = 0;
        m_evtDraggingOffset: PIXI.Point = null;

        //
        /*!
         */
        constructor(strId: string) {
            this.m_oCRenderer = PIXI.autoDetectRenderer(SCREEN_W, SCREEN_H, { preserveDrawingBuffer: true }, false);
            this.m_oCContainer = new PIXI.Container();
            this.m_listLayer = [];
            this.m_listGroup = [];
            this.m_nGroupCount = 0;

            this.m_evtDragging = false;
            this.m_evtDraggingGroup = 0;
            this.m_evtDraggingOffset = null;

            document.getElementById(strId).appendChild(this.m_oCRenderer.view);

            //

            for (let n: number = 0; n < E_LAYER.MAX; n++) {
                this.m_listLayer.push([]);
            }

            //

            let oCTex: PIXI.Texture = PIXI.Texture.fromImage("asset/drop.png", false, 1);
            let oCSpr: CFormSprite = new CFormSprite(oCTex);

            oCSpr.interactive = true;
            oCSpr.on("mousedown", evt_mousedown);
            oCSpr.on("touchstart", evt_mousedown);
            oCSpr.on("mousemove", evt_mousemove);
            oCSpr.on("touchmove", evt_mousemove);
            oCSpr.on("mouseup", evt_mouseup);
            oCSpr.on("touchend", evt_mouseup);

            this.m_listLayer[E_LAYER.BG].push(oCSpr);
        }

        //
        public pro_proc(): void {
        }

        //
        public render(): void {
            this.m_oCContainer.removeChildren();

            for (let nLayer: number = 0; nLayer < this.m_listLayer.length; nLayer++) {
                let oCLayer: Array<PIXI.Container> = this.m_listLayer[nLayer];
                for (let n: number = 0; n < oCLayer.length; n++) {
                    const oCContainer: PIXI.Container = oCLayer[n];
                    this.m_oCContainer.addChildAt(oCContainer, 0);
                }
            }

            this.m_oCRenderer.render(this.m_oCContainer);
        }

        //
        public sprite_setup(oCJson: ICOLLAGE, listCItem: Array<ICOLLAGE_ITEM>): void {

            for (let i: number = 0; i < listCItem.length; i++) {

                const nGroupIdx: number = this.m_nGroupCount++;
                const iCItem: ICOLLAGE_ITEM = listCItem[i];

                this.m_listGroup.push([]);

                for (let n: number = 0; n < iCItem.images.length; n++) {
                    let oCImage: ICOLLAGE_IMAGE = iCItem.images[n];
                    let oCTex = PIXI.Texture.fromFrame(oCImage.src);
                    let oCSpr = new CFormSprite(oCTex);

                    oCSpr.x = oCJson.pos.x + iCItem.pos.x;
                    oCSpr.y = oCJson.pos.y + iCItem.pos.y;

                    oCSpr.m_nGroupIdx = nGroupIdx;
                    oCSpr.m_bMovable = iCItem.movable;
                    oCSpr.m_nPriority = iCItem.priority;

                    this.m_listLayer[E_LAYER[oCImage.layer]].push(oCSpr);
                    this.m_listGroup[nGroupIdx].push(oCSpr);
                }
            }
        }

        //
        public sprite_reorder(): void {
            for (let nLayer: number = 0; nLayer < this.m_listLayer.length; nLayer++) {
                let listNew = this.m_listLayer[nLayer].sort(
                    function(objA, objB) {
                        if (objA.m_nPriority < objB.m_nPriority) return (1);
                        if (objA.m_nPriority > objB.m_nPriority) return (-1);
                        return (0);
                    }
                );
            }
        }
    }

    // ----------------------------------------------------------- function(s)
    // =======================================================================
    function hittest(posWorld: PIXI.Point, evt: (oCSpr: CFormSprite) => void): void {
        for (let nLayer: number = 0; nLayer < CMainFrame.INSTANCE.m_listLayer.length; nLayer++) {
            const listSprite: Array<CFormSprite> = CMainFrame.INSTANCE.m_listLayer[nLayer];
            for (let n: number = 0; n < listSprite.length; n++) {
                const oCSpr: CFormSprite = listSprite[n];

                if (oCSpr.m_bMovable == true) {
                    if (oCSpr.spr_hittest(posWorld) == true) {
                        if (oCSpr.tex_hittest(posWorld) == true) {
                            evt(oCSpr);
                            return;
                        }
                    }
                }
            }
        }
    }

    // =======================================================================
    function evt_mousedown(oCEvt: any): void {

        let nScaledMousePosX: number = Math.floor(oCEvt.data.global.x / CMainFrame.INSTANCE.m_oCContainer.scale.x);
        let nScaledMousePosY: number = Math.floor(oCEvt.data.global.y / CMainFrame.INSTANCE.m_oCContainer.scale.y);
        let posWorld: PIXI.Point = new PIXI.Point(
            nScaledMousePosX,
            nScaledMousePosY
        );

        hittest(
            posWorld,
            function(oCSpr) {
                CMainFrame.INSTANCE.m_evtDragging = true;
                CMainFrame.INSTANCE.m_evtDraggingGroup = oCSpr.m_nGroupIdx;
                CMainFrame.INSTANCE.m_evtDraggingOffset = new PIXI.Point(
                    posWorld.x - oCSpr.x,
                    posWorld.y - oCSpr.y
                );
            }
        );
    }

    // =======================================================================
    function evt_mousemove(oCEvt: any): void {

        if (CMainFrame.INSTANCE.m_evtDragging == true) {
            const listSpr: Array<CFormSprite> = CMainFrame.INSTANCE.m_listGroup[CMainFrame.INSTANCE.m_evtDraggingGroup];

            // Wear SNAP

            let nScaledMousePosX: number = Math.floor(oCEvt.data.global.x / CMainFrame.INSTANCE.m_oCContainer.scale.x);
            let nScaledMousePosY: number = Math.floor(oCEvt.data.global.y / CMainFrame.INSTANCE.m_oCContainer.scale.y);
            let nXAdjust = nScaledMousePosX - CMainFrame.INSTANCE.m_evtDraggingOffset.x;
            let nYAdjust = nScaledMousePosY - CMainFrame.INSTANCE.m_evtDraggingOffset.y;

            if (Math.abs(nXAdjust - CMainFrame.INSTANCE.m_oCCollage.pos.x) < SNAP_REGION)
                if (Math.abs(nYAdjust - CMainFrame.INSTANCE.m_oCCollage.pos.y) < SNAP_REGION) {
                    nXAdjust = CMainFrame.INSTANCE.m_oCCollage.pos.x;
                    nYAdjust = CMainFrame.INSTANCE.m_oCCollage.pos.y;
                }

            for (let oCSpr of listSpr) {
                oCSpr.alpha = 0.75;
                oCSpr.x = nXAdjust;
                oCSpr.y = nYAdjust;
            }
        }
    }

    // =======================================================================
    function evt_mouseup(oCEvt: any): void {

        if (CMainFrame.INSTANCE.m_evtDragging == true) {
            const listSpr: Array<CFormSprite> = CMainFrame.INSTANCE.m_listGroup[CMainFrame.INSTANCE.m_evtDraggingGroup];

            for (let oCSpr of listSpr) {
                oCSpr.alpha = 1.00;
            }
        }

        CMainFrame.INSTANCE.m_evtDragging = false;
        CMainFrame.INSTANCE.m_evtDraggingGroup = null;
        CMainFrame.INSTANCE.m_evtDraggingOffset = null;
    }

    // =======================================================================
    /*!
     * @brief
     */
    export function save_screenshot() {
        let oCCanvasData = CMainFrame.INSTANCE.m_oCRenderer.view.toDataURL("image/png");
        location.href = oCCanvasData;
    }

    // =======================================================================
    function evt_window_resize() {
        let fW: number = SCREEN_W * 1.0;
        let fH: number = SCREEN_H * 1.0;
        let fScale: number = 1.0;

        const fAspectSrc = fW / fH;
        const fAspectDst = window.innerWidth / window.innerHeight;

        if (fAspectDst > fAspectSrc) {
            if (window.innerHeight < SCREEN_H) {
                fScale = window.innerHeight / (SCREEN_H * 1.0);
                fW = fW * fScale;
                fH = window.innerHeight;
            }
        } else {
            if (window.innerWidth < SCREEN_W) {
                fScale = window.innerWidth / (SCREEN_W * 1.0);
                fW = window.innerWidth;
                fH = fH * fScale;
            }
        }

        CMainFrame.INSTANCE.m_oCRenderer.resize(fW, fH);
        CMainFrame.INSTANCE.m_oCContainer.scale.x = fScale;
        CMainFrame.INSTANCE.m_oCContainer.scale.y = fScale;

        window.scrollTo(0, 0);
    }

    // ==========================================================================
    /*!
     */
    function import_from_url(strUrl: string): void {
        $.getJSON(
            strUrl,
            function(oCJson: ICOLLAGE) {
                console.log("json loaded.");

                // リソース内のパス解決
                let listRe: Array<string> = /(.*)model\.json$/.exec(strUrl);
                if (listRe !== null) {
                    let oCLoader = new PIXI.loaders.Loader();

                    const strResourceDir: string = listRe[1];

                    for (let n: number = 0; n < oCJson.textures.length; n++) {
                        oCLoader.add(strResourceDir + oCJson.textures[n]);
                        //console.log(strResourceDir + oCJson.textures[n]);
                    }

                    oCLoader.once(
                        "complete",
                        function() {
                            CMainFrame.INSTANCE.sprite_setup(oCJson, oCJson.body.items);
                            CMainFrame.INSTANCE.sprite_setup(oCJson, oCJson.wear.items);
                            CMainFrame.INSTANCE.sprite_reorder();

                            CMainFrame.INSTANCE.m_oCCollage = oCJson;

                            $("#resource_name").text(oCJson.name);
                        }
                    );
                    oCLoader.load();
                }
            }
        );
    }

    // ===========================================================================
    /*!
     */
    function get_url_param(): Array<string> {
        let listResult: string[] = [];
        let listParam: string[] = window.location.href.slice(window.location.href.indexOf("?") + 1).split("&");

        for (let n: number = 0; n < listParam.length; n++) {
            let listData: Array<string> = listParam[n].split("=");

            listResult.push(listData[0]);
            listResult[listData[0]] = listData[1];
        }

        return (listResult);
    }

    // =======================================================================
    /*!
     * @brief ディスプレイインスタンスの生成処理
     */
    export function create_instance(strId: string): CMainFrame {

        let oCResult: CMainFrame = null;
        let listParam: Array<string> = get_url_param();
        let strAsset: string = listParam["asset"];

        if (strAsset == null) {
            strAsset = "asset/einhald/model.json";
        }

        if (CMainFrame.INSTANCE != null) {
            oCResult = CMainFrame.INSTANCE;
        } else {
            oCResult = new CMainFrame(strId);
            CMainFrame.INSTANCE = oCResult;

            import_from_url(strAsset);
        }

        window.onresize = function() {
            evt_window_resize();
        }

        evt_window_resize();

        return (oCResult);
    }
}   // form_collage


// --------------------------------------------------------------------- [EOF]
