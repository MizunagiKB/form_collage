// ===========================================================================
/*!
 * @brief uniForm Collage
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="easeljs/easeljs.d.ts" />
/// <reference path="preloadjs/preloadjs.d.ts" />


// ---------------------------------------------------------------- declare(s)
declare module Ihogan {
    export interface hogan
    {
        compile;
    }
}

declare var Hogan: Ihogan.hogan;

declare module Ijquery {
    export interface jquery
    {
        (o);
        getJSON(url: string, callback: (o: any) => void);
    }
}

declare var $: Ijquery.jquery;


// ------------------------------------------------------------------- enum(s)
enum E_LAYER
{
    DROP,
    BODY_FORE,
    BODY_BASE,
    BODY_BACK,

    WEAR_FORE,
    WEAR_BASE,
    WEAR_BACK
}


// -------------------------------------------------------------- interface(s)
interface ICOLLAGE_POS
{
    x: number;
    y: number;
}

interface ICOLLAGE_IMAGE
{
    layer: string;
    src: string;
    offset: ICOLLAGE_POS;
}

interface ICOLLAGE_ITEM
{
    pos: ICOLLAGE_POS;
    hitArea: ICOLLAGE_IMAGE;
    images: Array<ICOLLAGE_IMAGE>;
}

interface ICOLLAGE_BODY
{
    name: string;
    items: Array<ICOLLAGE_ITEM>;
}

interface ICOLLAGE_WEAR
{
    items: Array<ICOLLAGE_ITEM>;
}

interface ICOLLAGE
{
    body: ICOLLAGE_BODY;
    wear: ICOLLAGE_WEAR;
}

class CRenderNode
{
    m_oCItem: ICOLLAGE_ITEM;
    m_listImage: Array<createjs.Bitmap>;

    constructor(oCItem: ICOLLAGE_ITEM)
    {
        this.m_oCItem = oCItem;
        this.m_listImage = [];
    }
}

// ---------------------------------------------------------- Global Object(s)
var GLOBAL: {
    STAGE: createjs.Stage;
    STAGE_LAYER: any;
    STAGE_IMAGE: any;
    COLLAGE_DATA: ICOLLAGE;
} = {
    STAGE: null,
    STAGE_LAYER: {},
    STAGE_IMAGE: {},
    COLLAGE_DATA: null
}


// -------------------------------------------------------------- function(s)
// ==========================================================================
/*!
 */
function evt_pressmove(oCEvt)
{
    let oCNode: CRenderNode = GLOBAL.STAGE_IMAGE[oCEvt.target.id];
	let oCInstance = oCEvt.target;
    let oCPos = oCInstance.offset;

	let posCalc = new createjs.Point(
        oCEvt.stageX + oCPos.x,
        oCEvt.stageY + oCPos.y
    );
    let posAdjust = new createjs.Point(
        posCalc.x - oCNode.m_oCItem.hitArea.offset.x + 160,
        posCalc.y - oCNode.m_oCItem.hitArea.offset.y + 0
    );

    if(Math.abs(posAdjust.x) < 32)
    {
        if(Math.abs(posAdjust.y) < 32)
        {
            posCalc.x -= posAdjust.x;
            posCalc.y -= posAdjust.y;
            //console.log(oCNode.m_oCItem.hitArea.src);
        }
    }

	oCInstance.x = posCalc.x;
	oCInstance.y = posCalc.y;

    for(let o of oCNode.m_listImage)
    {
        o.x = posCalc.x;
        o.y = posCalc.y;
    }
}


// ==========================================================================
/*!
 */
function evt_pressup(oCEvt): void
{
}


// ==========================================================================
/*!
 */
function evt_mousedown(oCEvt): void
{
	var oCInstance = oCEvt.target;
    var oCPos = oCInstance.offset;

	oCInstance.on("pressmove", evt_pressmove);
	oCInstance.on("pressup", evt_pressup);
	oCInstance.offset = new createjs.Point(
        oCInstance.x - oCEvt.stageX,
        oCInstance.y - oCEvt.stageY
    );
}


// ==========================================================================
/*!
 */
function insert_queue(strBaseDir: string, oCQueue: createjs.LoadQueue, listItem: Array<ICOLLAGE_ITEM>): void
{
    for(let oCItem of listItem)
    {
        if(oCItem.hitArea !== null)
        {
            oCQueue.loadFile(
                {
                    "id": oCItem.hitArea.layer + oCItem.hitArea.src,
                    "src": strBaseDir + oCItem.hitArea.src
                }
            );
        }

        for(let o of oCItem.images)
        {
            oCQueue.loadFile(
                {
                    "id": o.layer + o.src,
                    "src": strBaseDir + o.src
                }
            );
        }
    }
}


// ==========================================================================
/*!
 */
function evt_complete_queue(strBaseDir: string, oCQueue: createjs.LoadQueue, listItem: Array<ICOLLAGE_ITEM>): void
{
    for(let oCItem of listItem)
    {
        let oCNode: CRenderNode = new CRenderNode(oCItem);
        let oCContainer: createjs.Container = new createjs.Container();

        if(typeof oCItem.pos !== "undefined")
        {
            oCContainer.x = oCItem.pos.x;
            oCContainer.y = oCItem.pos.y;
        }

        for(let o of oCItem.images)
        {
            let oCLayer = GLOBAL.STAGE_LAYER[E_LAYER[o.layer]];
            let oCResource: any = oCQueue.getResult(strBaseDir + o.src);
            let oCImage = new createjs.Bitmap(oCResource);

            if(typeof oCItem.pos !== "undefined")
            {
                oCImage.x = oCItem.pos.x + o.offset.x;
                oCImage.y = oCItem.pos.y + o.offset.y;
            }

            oCLayer.addChildAt(oCImage, 0);

            oCNode.m_listImage.push(oCImage);
        }

        if(oCItem.hitArea !== null)
        {
            let oCResource: any = oCQueue.getResult(strBaseDir + oCItem.hitArea.src);
            let oCImage = new createjs.Bitmap(oCResource);

            oCContainer.x += oCItem.hitArea.offset.x;
            oCContainer.y += oCItem.hitArea.offset.y;

            oCContainer.hitArea = oCImage;
            oCContainer.on(
                "mousedown",
                evt_mousedown
            );

            GLOBAL.STAGE_IMAGE[oCContainer.id] = oCNode;
            GLOBAL.STAGE_LAYER[E_LAYER[oCItem.hitArea.layer]].addChildAt(oCContainer, 0);
        }
    }
}


// ==========================================================================
/*!
 */
function import_from_url(strUrl: string): void
{
    $.getJSON(
        strUrl,
        function(oCJson: ICOLLAGE)
        {
            //console.log("json loaded.");

            // リソース内のパス解決
            let listRe: Array<string> = /(.*)resource\.json$/.exec(strUrl);

            if(listRe !== null)
            {
                const strResourceDir: string = listRe[1];
                let oCQueue = new createjs.LoadQueue(false);

                oCQueue.on(
                    "complete",
                    function()
                    {
                        evt_complete_queue(strResourceDir, oCQueue, oCJson.body.items);
                        evt_complete_queue(strResourceDir, oCQueue, oCJson.wear.items);

                        //console.log("ready.");

                        $("#resource_name").text(oCJson.body.name);

                        GLOBAL.COLLAGE_DATA = oCJson;
                    }
                );

                insert_queue(strResourceDir, oCQueue, oCJson.body.items);
                insert_queue(strResourceDir, oCQueue, oCJson.wear.items);
            }
        }
    );
}

function evt_window_resize()
{
    let fW: number = 1024.0;
    let fH: number = 768.0;
    let fScale: number = 1.0;
    const fAspectSrc = fW / fH;
    const fAspectDst = window.innerWidth / window.innerHeight;

    if(fAspectDst > fAspectSrc)
    {
        if(window.innerHeight < 768)
        {
            fScale = window.innerHeight / 768.0;
            fW = fW * fScale;
            fH = window.innerHeight;
        }
    } else {
        if(window.innerWidth < 1024)
        {
            fScale = window.innerWidth / 1024.0;
            fW = window.innerWidth;
            fH = fH * fScale;
        }
    }

    GLOBAL.STAGE.canvas.width = fW;
    GLOBAL.STAGE.canvas.height = fH;
    GLOBAL.STAGE.setTransform(0, 0, fScale, fScale);
}

// ===========================================================================
/*!
 */
function main(): void
{
    GLOBAL.STAGE = new createjs.Stage("main_surface");
    GLOBAL.STAGE.canvas.width = 1024;
    GLOBAL.STAGE.canvas.height = 768;

    createjs.Ticker.on("tick", GLOBAL.STAGE);
    createjs.Touch.enable(GLOBAL.STAGE);

    window.onresize = function()
    {
        evt_window_resize();
    }

    evt_window_resize();

    // 描画順序を管理するためのレイヤーを生成
    let listLayer = [
        E_LAYER.DROP,
        E_LAYER.BODY_BACK, E_LAYER.WEAR_BACK,
        E_LAYER.BODY_BASE, E_LAYER.WEAR_BASE,
        E_LAYER.BODY_FORE, E_LAYER.WEAR_FORE
    ];
    for(let i of listLayer)
    {
        GLOBAL.STAGE_LAYER[i] = new createjs.Container();
        GLOBAL.STAGE.addChild(GLOBAL.STAGE_LAYER[i]);
    }

    GLOBAL.STAGE_LAYER[E_LAYER.DROP].addChild(new createjs.Bitmap("assets/drop.png"));

    import_from_url("assets/einhald/resource.json");
}
