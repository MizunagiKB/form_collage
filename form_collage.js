// ===========================================================================
/*!
 * @brief uniForm Collage
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="easeljs/easeljs.d.ts" />
/// <reference path="preloadjs/preloadjs.d.ts" />
var E_LAYER;
(function (E_LAYER) {
    E_LAYER[E_LAYER["DROP"] = 0] = "DROP";
    E_LAYER[E_LAYER["BODY_FORE"] = 1] = "BODY_FORE";
    E_LAYER[E_LAYER["BODY_BASE"] = 2] = "BODY_BASE";
    E_LAYER[E_LAYER["BODY_BACK"] = 3] = "BODY_BACK";
    E_LAYER[E_LAYER["WEAR_FORE"] = 4] = "WEAR_FORE";
    E_LAYER[E_LAYER["WEAR_BASE"] = 5] = "WEAR_BASE";
    E_LAYER[E_LAYER["WEAR_BACK"] = 6] = "WEAR_BACK";
})(E_LAYER || (E_LAYER = {}));
var CRenderNode = (function () {
    function CRenderNode(oCItem) {
        this.m_oCItem = oCItem;
        this.m_listImage = [];
    }
    return CRenderNode;
})();
var GLOBAL = {
    STAGE: null,
    STAGE_LAYER: {},
    STAGE_IMAGE: {},
    COLLAGE_DATA: null
};
/*!
 */
function evt_pressmove(oCEvt) {
    var oCNode = GLOBAL.STAGE_IMAGE[oCEvt.target.id];
    var oCInstance = oCEvt.target;
    var oCPos = oCInstance.offset;
    var posCalc = new createjs.Point(oCEvt.stageX + oCPos.x, oCEvt.stageY + oCPos.y);
    var posAdjust = new createjs.Point(posCalc.x - oCNode.m_oCItem.hitArea.offset.x + 160, posCalc.y - oCNode.m_oCItem.hitArea.offset.y + 0);
    if (Math.abs(posAdjust.x) < 32) {
        if (Math.abs(posAdjust.y) < 32) {
            posCalc.x -= posAdjust.x;
            posCalc.y -= posAdjust.y;
        }
    }
    oCInstance.x = posCalc.x;
    oCInstance.y = posCalc.y;
    for (var _i = 0, _a = oCNode.m_listImage; _i < _a.length; _i++) {
        var o = _a[_i];
        o.x = posCalc.x;
        o.y = posCalc.y;
    }
}
/*!
 */
function evt_pressup(oCEvt) {
}
/*!
 */
function evt_mousedown(oCEvt) {
    var oCInstance = oCEvt.target;
    var oCPos = oCInstance.offset;
    oCInstance.on("pressmove", evt_pressmove);
    oCInstance.on("pressup", evt_pressup);
    oCInstance.offset = new createjs.Point(oCInstance.x - oCEvt.stageX, oCInstance.y - oCEvt.stageY);
}
/*!
 */
function insert_queue(strBaseDir, oCQueue, listItem) {
    for (var _i = 0; _i < listItem.length; _i++) {
        var oCItem = listItem[_i];
        if (oCItem.hitArea !== null) {
            oCQueue.loadFile({
                "id": oCItem.hitArea.layer + oCItem.hitArea.src,
                "src": strBaseDir + oCItem.hitArea.src
            });
        }
        for (var _a = 0, _b = oCItem.images; _a < _b.length; _a++) {
            var o = _b[_a];
            oCQueue.loadFile({
                "id": o.layer + o.src,
                "src": strBaseDir + o.src
            });
        }
    }
}
/*!
 */
function evt_complete_queue(strBaseDir, oCQueue, listItem) {
    for (var _i = 0; _i < listItem.length; _i++) {
        var oCItem = listItem[_i];
        var oCNode = new CRenderNode(oCItem);
        var oCContainer = new createjs.Container();
        if (typeof oCItem.pos !== "undefined") {
            oCContainer.x = oCItem.pos.x;
            oCContainer.y = oCItem.pos.y;
        }
        for (var _a = 0, _b = oCItem.images; _a < _b.length; _a++) {
            var o = _b[_a];
            var oCLayer = GLOBAL.STAGE_LAYER[E_LAYER[o.layer]];
            var oCResource = oCQueue.getResult(strBaseDir + o.src);
            var oCImage = new createjs.Bitmap(oCResource);
            if (typeof oCItem.pos !== "undefined") {
                oCImage.x = oCItem.pos.x + o.offset.x;
                oCImage.y = oCItem.pos.y + o.offset.y;
            }
            oCLayer.addChildAt(oCImage, 0);
            oCNode.m_listImage.push(oCImage);
        }
        if (oCItem.hitArea !== null) {
            var oCResource = oCQueue.getResult(strBaseDir + oCItem.hitArea.src);
            var oCImage = new createjs.Bitmap(oCResource);
            oCContainer.x += oCItem.hitArea.offset.x;
            oCContainer.y += oCItem.hitArea.offset.y;
            oCContainer.hitArea = oCImage;
            oCContainer.on("mousedown", evt_mousedown);
            GLOBAL.STAGE_IMAGE[oCContainer.id] = oCNode;
            GLOBAL.STAGE_LAYER[E_LAYER[oCItem.hitArea.layer]].addChildAt(oCContainer, 0);
        }
    }
}
/*!
 */
function import_from_url(strUrl) {
    $.getJSON(strUrl, function (oCJson) {
        //console.log("json loaded.");
        var listRe = /(.*)resource\.json$/.exec(strUrl);
        if (listRe !== null) {
            var strResourceDir = listRe[1];
            var oCQueue = new createjs.LoadQueue(false);
            oCQueue.on("complete", function () {
                evt_complete_queue(strResourceDir, oCQueue, oCJson.body.items);
                evt_complete_queue(strResourceDir, oCQueue, oCJson.wear.items);
                $("#resource_name").text(oCJson.body.name);
                GLOBAL.COLLAGE_DATA = oCJson;
            });
            insert_queue(strResourceDir, oCQueue, oCJson.body.items);
            insert_queue(strResourceDir, oCQueue, oCJson.wear.items);
        }
    });
}
function evt_window_resize() {
    var fW = 1024.0;
    var fH = 768.0;
    var fScale = 1.0;
    var fAspectSrc = fW / fH;
    var fAspectDst = window.innerWidth / window.innerHeight;
    if (fAspectDst > fAspectSrc) {
        if (window.innerHeight < 768) {
            fScale = window.innerHeight / 768.0;
            fW = fW * fScale;
            fH = window.innerHeight;
        }
    }
    else {
        if (window.innerWidth < 1024) {
            fScale = window.innerWidth / 1024.0;
            fW = window.innerWidth;
            fH = fH * fScale;
        }
    }
    GLOBAL.STAGE.canvas.width = fW;
    GLOBAL.STAGE.canvas.height = fH;
    GLOBAL.STAGE.setTransform(0, 0, fScale, fScale);
}
/*!
 */
function main() {
    GLOBAL.STAGE = new createjs.Stage("main_surface");
    GLOBAL.STAGE.canvas.width = 1024;
    GLOBAL.STAGE.canvas.height = 768;
    createjs.Ticker.on("tick", GLOBAL.STAGE);
    createjs.Touch.enable(GLOBAL.STAGE);
    window.onresize = function () {
        evt_window_resize();
    };
    evt_window_resize();
    var listLayer = [
        E_LAYER.DROP,
        E_LAYER.BODY_BACK, E_LAYER.WEAR_BACK,
        E_LAYER.BODY_BASE, E_LAYER.WEAR_BASE,
        E_LAYER.BODY_FORE, E_LAYER.WEAR_FORE
    ];
    for (var _i = 0; _i < listLayer.length; _i++) {
        var i = listLayer[_i];
        GLOBAL.STAGE_LAYER[i] = new createjs.Container();
        GLOBAL.STAGE.addChild(GLOBAL.STAGE_LAYER[i]);
    }
    GLOBAL.STAGE_LAYER[E_LAYER.DROP].addChild(new createjs.Bitmap("assets/drop.png"));
    import_from_url("assets/einhald/resource.json");
}
