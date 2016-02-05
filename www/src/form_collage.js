/*!
 * @brief uniForm Collage
 * @author @MizunagiKB
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var form_collage;
(function (form_collage) {
    var E_LAYER;
    (function (E_LAYER) {
        E_LAYER[E_LAYER["WEAR_FORE"] = 0] = "WEAR_FORE";
        E_LAYER[E_LAYER["BODY_FORE"] = 1] = "BODY_FORE";
        E_LAYER[E_LAYER["WEAR_BASE"] = 2] = "WEAR_BASE";
        E_LAYER[E_LAYER["BODY_BASE"] = 3] = "BODY_BASE";
        E_LAYER[E_LAYER["WEAR_BACK"] = 4] = "WEAR_BACK";
        E_LAYER[E_LAYER["BODY_BACK"] = 5] = "BODY_BACK";
        E_LAYER[E_LAYER["BG"] = 6] = "BG";
        E_LAYER[E_LAYER["MAX"] = 7] = "MAX";
    })(E_LAYER || (E_LAYER = {}));
    var SCREEN_W = 1024;
    var SCREEN_H = 768;
    var SNAP_REGION = 32;
    var DRAGGABLE_ALPHA = 32;
    var CFormSprite = (function (_super) {
        __extends(CFormSprite, _super);
        function CFormSprite() {
            _super.apply(this, arguments);
            this.m_nGroupIdx = 0;
            this.m_bMovable = false;
            this.m_nPriority = 0;
        }
        CFormSprite.prototype.spr_hittest = function (posWorld) {
            if (posWorld.x < this.x + this.texture.trim.x)
                return (false);
            if (posWorld.y < this.y + this.texture.trim.y)
                return (false);
            if (posWorld.x > this.x + this.texture.trim.x + this.texture.crop.width)
                return (false);
            if (posWorld.y > this.y + this.texture.trim.y + this.texture.crop.height)
                return (false);
            return (true);
        };
        CFormSprite.prototype.tex_hittest = function (posWorld) {
            var posLocal = new PIXI.Point(posWorld.x - this.x, posWorld.y - this.y);
            var oCCanvas = document.createElement("canvas");
            var oCContext = oCCanvas.getContext("2d");
            oCCanvas.width = this.texture.baseTexture.source.width;
            oCCanvas.height = this.texture.baseTexture.source.height;
            oCContext.drawImage(this.texture.baseTexture.source, 0, 0);
            var aryImage = oCContext.getImageData(0, 0, oCCanvas.width, oCCanvas.height).data;
            var sampleAddress = 0;
            sampleAddress += (oCCanvas.width * 4 * (this.texture.frame.y + (posLocal.y - this.texture.trim.y)));
            sampleAddress += ((this.texture.frame.x + (posLocal.x - this.texture.trim.x)) * 4);
            sampleAddress += 3;
            return (aryImage[sampleAddress] > DRAGGABLE_ALPHA);
        };
        return CFormSprite;
    })(PIXI.Sprite);
    var CMainFrame = (function () {
        function CMainFrame(strId) {
            this.m_oCRenderer = null;
            this.m_oCContainer = null;
            this.m_listLayer = [];
            this.m_listGroup = [];
            this.m_nGroupCount = 0;
            this.m_oCCollage = null;
            this.m_evtDragging = false;
            this.m_evtDraggingGroup = 0;
            this.m_evtDraggingOffset = null;
            this.m_oCRenderer = PIXI.autoDetectRenderer(SCREEN_W, SCREEN_H, { preserveDrawingBuffer: true }, false);
            this.m_oCContainer = new PIXI.Container();
            this.m_listLayer = [];
            this.m_listGroup = [];
            this.m_nGroupCount = 0;
            this.m_evtDragging = false;
            this.m_evtDraggingGroup = 0;
            this.m_evtDraggingOffset = null;
            document.getElementById(strId).appendChild(this.m_oCRenderer.view);
            for (var n = 0; n < E_LAYER.MAX; n++) {
                this.m_listLayer.push([]);
            }
            var oCTex = PIXI.Texture.fromImage("asset/drop.png", false, 1);
            var oCSpr = new CFormSprite(oCTex);
            oCSpr.interactive = true;
            oCSpr.on("mousedown", evt_mousedown);
            oCSpr.on("touchstart", evt_mousedown);
            oCSpr.on("mousemove", evt_mousemove);
            oCSpr.on("touchmove", evt_mousemove);
            oCSpr.on("mouseup", evt_mouseup);
            oCSpr.on("touchend", evt_mouseup);
            this.m_listLayer[E_LAYER.BG].push(oCSpr);
        }
        CMainFrame.prototype.pro_proc = function () {
        };
        CMainFrame.prototype.render = function () {
            this.m_oCContainer.removeChildren();
            for (var nLayer = 0; nLayer < this.m_listLayer.length; nLayer++) {
                var oCLayer = this.m_listLayer[nLayer];
                for (var n = 0; n < oCLayer.length; n++) {
                    var oCContainer = oCLayer[n];
                    this.m_oCContainer.addChildAt(oCContainer, 0);
                }
            }
            this.m_oCRenderer.render(this.m_oCContainer);
        };
        CMainFrame.prototype.sprite_setup = function (oCJson, listCItem) {
            for (var i = 0; i < listCItem.length; i++) {
                var nGroupIdx = this.m_nGroupCount++;
                var iCItem = listCItem[i];
                this.m_listGroup.push([]);
                for (var n = 0; n < iCItem.images.length; n++) {
                    var oCImage = iCItem.images[n];
                    var oCTex = PIXI.Texture.fromFrame(oCImage.src);
                    var oCSpr = new CFormSprite(oCTex);
                    oCSpr.x = oCJson.pos.x + iCItem.pos.x;
                    oCSpr.y = oCJson.pos.y + iCItem.pos.y;
                    oCSpr.m_nGroupIdx = nGroupIdx;
                    oCSpr.m_bMovable = iCItem.movable;
                    oCSpr.m_nPriority = iCItem.priority;
                    this.m_listLayer[E_LAYER[oCImage.layer]].push(oCSpr);
                    this.m_listGroup[nGroupIdx].push(oCSpr);
                }
            }
        };
        CMainFrame.prototype.sprite_reorder = function () {
            for (var nLayer = 0; nLayer < this.m_listLayer.length; nLayer++) {
                var listNew = this.m_listLayer[nLayer].sort(function (objA, objB) {
                    if (objA.m_nPriority < objB.m_nPriority)
                        return (1);
                    if (objA.m_nPriority > objB.m_nPriority)
                        return (-1);
                    return (0);
                });
            }
        };
        CMainFrame.INSTANCE = null;
        return CMainFrame;
    })();
    form_collage.CMainFrame = CMainFrame;
    function hittest(posWorld, evt) {
        for (var nLayer = 0; nLayer < CMainFrame.INSTANCE.m_listLayer.length; nLayer++) {
            var listSprite = CMainFrame.INSTANCE.m_listLayer[nLayer];
            for (var n = 0; n < listSprite.length; n++) {
                var oCSpr = listSprite[n];
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
    function evt_mousedown(oCEvt) {
        var nScaledMousePosX = Math.floor(oCEvt.data.global.x / CMainFrame.INSTANCE.m_oCContainer.scale.x);
        var nScaledMousePosY = Math.floor(oCEvt.data.global.y / CMainFrame.INSTANCE.m_oCContainer.scale.y);
        var posWorld = new PIXI.Point(nScaledMousePosX, nScaledMousePosY);
        hittest(posWorld, function (oCSpr) {
            CMainFrame.INSTANCE.m_evtDragging = true;
            CMainFrame.INSTANCE.m_evtDraggingGroup = oCSpr.m_nGroupIdx;
            CMainFrame.INSTANCE.m_evtDraggingOffset = new PIXI.Point(posWorld.x - oCSpr.x, posWorld.y - oCSpr.y);
        });
    }
    function evt_mousemove(oCEvt) {
        if (CMainFrame.INSTANCE.m_evtDragging == true) {
            var listSpr = CMainFrame.INSTANCE.m_listGroup[CMainFrame.INSTANCE.m_evtDraggingGroup];
            var nScaledMousePosX = Math.floor(oCEvt.data.global.x / CMainFrame.INSTANCE.m_oCContainer.scale.x);
            var nScaledMousePosY = Math.floor(oCEvt.data.global.y / CMainFrame.INSTANCE.m_oCContainer.scale.y);
            var nXAdjust = nScaledMousePosX - CMainFrame.INSTANCE.m_evtDraggingOffset.x;
            var nYAdjust = nScaledMousePosY - CMainFrame.INSTANCE.m_evtDraggingOffset.y;
            if (Math.abs(nXAdjust - CMainFrame.INSTANCE.m_oCCollage.pos.x) < SNAP_REGION)
                if (Math.abs(nYAdjust - CMainFrame.INSTANCE.m_oCCollage.pos.y) < SNAP_REGION) {
                    nXAdjust = CMainFrame.INSTANCE.m_oCCollage.pos.x;
                    nYAdjust = CMainFrame.INSTANCE.m_oCCollage.pos.y;
                }
            for (var _i = 0; _i < listSpr.length; _i++) {
                var oCSpr = listSpr[_i];
                oCSpr.alpha = 0.75;
                oCSpr.x = nXAdjust;
                oCSpr.y = nYAdjust;
            }
        }
    }
    function evt_mouseup(oCEvt) {
        if (CMainFrame.INSTANCE.m_evtDragging == true) {
            var listSpr = CMainFrame.INSTANCE.m_listGroup[CMainFrame.INSTANCE.m_evtDraggingGroup];
            for (var _i = 0; _i < listSpr.length; _i++) {
                var oCSpr = listSpr[_i];
                oCSpr.alpha = 1.00;
            }
        }
        CMainFrame.INSTANCE.m_evtDragging = false;
        CMainFrame.INSTANCE.m_evtDraggingGroup = null;
        CMainFrame.INSTANCE.m_evtDraggingOffset = null;
    }
    function save_screenshot() {
        var oCCanvasData = CMainFrame.INSTANCE.m_oCRenderer.view.toDataURL("image/png");
        location.href = oCCanvasData;
    }
    form_collage.save_screenshot = save_screenshot;
    function evt_window_resize() {
        var fW = SCREEN_W * 1.0;
        var fH = SCREEN_H * 1.0;
        var fScale = 1.0;
        var fAspectSrc = fW / fH;
        var fAspectDst = window.innerWidth / window.innerHeight;
        if (fAspectDst > fAspectSrc) {
            if (window.innerHeight < SCREEN_H) {
                fScale = window.innerHeight / (SCREEN_H * 1.0);
                fW = fW * fScale;
                fH = window.innerHeight;
            }
        }
        else {
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
    function import_from_url(strUrl) {
        $.getJSON(strUrl, function (oCJson) {
            console.log("json loaded.");
            var listRe = /(.*)model\.json$/.exec(strUrl);
            if (listRe !== null) {
                var oCLoader = new PIXI.loaders.Loader();
                var strResourceDir = listRe[1];
                for (var n = 0; n < oCJson.textures.length; n++) {
                    oCLoader.add(strResourceDir + oCJson.textures[n]);
                }
                oCLoader.once("complete", function () {
                    CMainFrame.INSTANCE.sprite_setup(oCJson, oCJson.body.items);
                    CMainFrame.INSTANCE.sprite_setup(oCJson, oCJson.wear.items);
                    CMainFrame.INSTANCE.sprite_reorder();
                    CMainFrame.INSTANCE.m_oCCollage = oCJson;
                    $("#resource_name").text(oCJson.name);
                });
                oCLoader.load();
            }
        });
    }
    function get_url_param() {
        var listResult = [];
        var listParam = window.location.href.slice(window.location.href.indexOf("?") + 1).split("&");
        for (var n = 0; n < listParam.length; n++) {
            var listData = listParam[n].split("=");
            listResult.push(listData[0]);
            listResult[listData[0]] = listData[1];
        }
        return (listResult);
    }
    function create_instance(strId) {
        var oCResult = null;
        var listParam = get_url_param();
        var strAsset = listParam["asset"];
        if (strAsset == null) {
            strAsset = "asset/einhald/model.json";
        }
        if (CMainFrame.INSTANCE != null) {
            oCResult = CMainFrame.INSTANCE;
        }
        else {
            oCResult = new CMainFrame(strId);
            CMainFrame.INSTANCE = oCResult;
            import_from_url(strAsset);
        }
        window.onresize = function () {
            evt_window_resize();
        };
        evt_window_resize();
        return (oCResult);
    }
    form_collage.create_instance = create_instance;
})(form_collage || (form_collage = {}));
//# sourceMappingURL=form_collage.js.map