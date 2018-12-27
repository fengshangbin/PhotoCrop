var _cropscale = require('./scale');
var SVGLoading = require('./svgloading');

var _C3PhotoCropInstance = function () {
	if($.extend==null){
		$.extend=function(defaultOption,options){
			for(var i in options){
				defaultOption[i]=options[i];
			};
			return defaultOption;
		}
	}
	var defaultOption = {
		photoURL: null,
		success: function(){},
		server: null,
		serverdata:{},
		needArrayData:false,
		cropSize: "0x0",
		thumbSize: "0x0",
		supportHiRes: true,
		photoExt: "jpg",
		language:"en",
		fullshow:true,
		gap: 10
	};
	var i18n={
		title:{cn:"图片裁剪",en:"Crop Photo"},
		tip:{cn:"拖拽图片或点击浏览，也可以右键粘贴",en:"Drop image here or click browse, also can right-paste"},
		tipMobile:{cn:"点击选择本地图片",en:"click to select photo"},
		full:{cn:"高清原图",en:"Full Photo"},
		free:{cn:"自由比例",en:"Free ratio"},
		origin:{cn:"原始比例",en:"Origin ratio"}
	};

	var _cropIsMobile=function(){
		return /(iphone|ios|android|iPad)/i.test(navigator.userAgent);
	};
	var _cropMouseDown, _cropMouseMove, _cropMouseUp;
	if(_cropIsMobile()){
		_cropMouseDown="touchstart";
		_cropMouseMove="touchmove";
		_cropMouseUp="touchend";
	}else{
		_cropMouseDown="mousedown";
		_cropMouseMove="mousemove";
		_cropMouseUp="mouseup";
	}
	//console.log(_cropMouseDown, _cropMouseMove, _cropMouseUp);

	var _cropDrag = {
		obj: null,
		transZRegexX: /\.*translateX\((.*)px\)/i,
		transZRegexY: /\.*translateY\((.*)px\)/i,
		init: function (options) {
			if(options.handler.length>0){
				for(var i=0;i<options.handler.length;i++){
					var handlerobj=options.handler[i];
					handlerobj.addEventListener(_cropMouseDown, this.start, false);
					//options.handler.onmousedown = this.start;
					handlerobj.root = options.root || handlerobj;
					var root = handlerobj.root;
					root.isLock=options.isLock;
					root.onDragStart = options.dragStart || new Function();
					root.onDrag = options.onDrag || new Function();
					root.onDragEnd = options.onDragEnd || new Function();
				}
			}
		},
		start: function (e) { //此时的this是handler
			var obj = _cropDrag.obj = this;
			e = _cropDrag.fixEvent(e);
			var ex = e.pageX;
			var ey = e.pageY;
			obj.lastMouseX = ex;
			obj.lastMouseY = ey;
			document.addEventListener(_cropMouseUp, _cropDrag.end, false);
			document.addEventListener(_cropMouseMove, _cropDrag.drag, false);
			if(obj.root.isLock){
				obj.root.onDragStart();
			}else{
				var x = parseFloat(_cropDrag.transZRegexX.exec(obj.root.style.transform)[1] || 0);
				var y = parseFloat(_cropDrag.transZRegexY.exec(obj.root.style.transform)[1] || 0);
				obj.root.onDragStart(x, y);
			}
		},
		drag: function (e) {
			e.preventDefault();
			e = _cropDrag.fixEvent(e);
			var ex = e.pageX;
			var ey = e.pageY;
			var root = _cropDrag.obj.root;
			var nx = ex - _cropDrag.obj.lastMouseX;
			var ny = ey - _cropDrag.obj.lastMouseY;
			if(!_cropDrag.obj.root.isLock){
				var x = parseFloat(_cropDrag.transZRegexX.exec(root.style.transform)[1] || 0);
				var y = parseFloat(_cropDrag.transZRegexY.exec(root.style.transform)[1] || 0);
				nx+=x;
				ny+=y;
				root.style.transform = root.style.transform.replace("translateX(" + x + "px)", "translateX(" + nx + "px)").replace("translateY(" + y + "px)", "translateY(" + ny + "px)");

			}
			_cropDrag.obj.root.onDrag(nx, ny);
			_cropDrag.obj.lastMouseX = ex;
			_cropDrag.obj.lastMouseY = ey;

		},
		end: function (e) {
			if(_cropDrag.obj.root.isLock){
				_cropDrag.obj.root.onDragEnd();
			}else{
				var x = parseFloat(_cropDrag.transZRegexX.exec(_cropDrag.obj.root.style.transform)[1] || 0);
				var y = parseFloat(_cropDrag.transZRegexY.exec(_cropDrag.obj.root.style.transform)[1] || 0);
				_cropDrag.obj.root.onDragEnd(x, y);
			}
			document.removeEventListener(_cropMouseUp, _cropDrag.end, false);
			document.removeEventListener(_cropMouseMove, _cropDrag.drag, false);
			_cropDrag.obj = null;
		},
		fixEvent: function (e) {
			if(e==null){
				e=window.event;
				e.pageX = e.clientX + document.documentElement.scrollLeft;
				e.pageY = e.clientY + document.documentElement.scrollTop;
			}
			if(e.pageX == null || e.pageY==null){
				e=e.changedTouches[0];
			}
			return e;
		}
	}

	var options;
	var currentLanguage;
	var lockRadio = false,
		freeRadio = false,
		hideRadio = false,
		hideZoom = false,//_cropIsMobile();
		hasPhoto = false,
		isHiRes = false;
	var outWidthOption, outHeightOption, thumbWidthOption, thumbHeightOption;
	var outWidth, outHeight, thumbWidth, thumbHeight, photoWidth, photoHeight;
	var img, file, reader, htmlWrap;
	/*var targetOutWidth, targetOutHeight, targetThumbWidth, targetThumbHeight;
	var targetOutX, targetOutY;*/
	var URL = window.URL || window.webkitURL;
	var loadingUI;

	var rotate = 0,
		scale, ow, oh, oscale, aw, ah, tw, th, tx, ty, cw, ch, ax, ay, radio;
	var ltx, lty;
	var c3photocropinput;
	//var matrix=new Matrix();

	function restorePhoto(_rotate) {
		if (hasPhoto == false) return;

		rotate = _rotate?_rotate:0;

		ow = photoWidth;
		oh = photoHeight;

		oscale = ow / oh;
		if (lockRadio == false) {
			if (rotate == 90 || rotate == 270) {
				radio = oh / ow;
			} else {
				radio = ow / oh;
			}
		}

		setArea();

		if (rotate == 90 || rotate == 270) {
			tw = Math.max(Math.ceil(ow * aw / oh), ah);
			th = Math.max(Math.ceil(oh * ah / ow), aw);
		} else {
			tw = Math.max(Math.ceil(ow * ah / oh), aw);
			th = Math.max(Math.ceil(oh * aw / ow), ah);
		}
		//tw+=20;
		//th+=20;

		tx = (aw - tw) / 2;
		ty = (ah - th) / 2;
		//tx=ty=0;

		renderPhoto();
		renderCropArea();
		setFreeRadioDrag();
	}

	function setArea(){
		if (cw / ch < radio) {
			aw = cw;
			ah = aw / radio;
		} else {
			ah = ch;
			aw = ah * radio;
		}
		ax = options.gap + (cw - aw) / 2;
		ay = options.gap + (ch - ah) / 2;

		resetOutSize();
	}

	function getCropArea() {
		scale = tw / ow;
		var cropW, cropH, cropX, cropY;
		if (rotate == 90 || rotate == 270) {
			cropW = ah / scale;
			cropH = aw / scale;
		} else {
			cropW = aw / scale;
			cropH = ah / scale;
		}

		if (rotate == 0) {
			ltx = 0;
			lty = 0;
			cropX = (tx - ltx) / scale;
			cropY = (ty - lty) / scale;
		} else if (rotate == 90) {
			ltx = aw - (tw + th) / 2;
			lty = (tw - th) / 2;
			cropY = -(tx - ltx) / scale;
			cropX = (ty - lty) / scale;
		} else if (rotate == 180) {
			ltx = aw - tw;
			lty = ah - th;
			cropX = -(tx - ltx) / scale;
			cropY = -(ty - lty) / scale;
		} else if (rotate == 270) {
			ltx = (th - tw) / 2;
			lty = ah - (th + tw) / 2;
			cropY = (tx - ltx) / scale;
			cropX = -(ty - lty) / scale;
		}
		//console.log(tx,ltx,ty,lty,scale);

		/*var angle=Math.PI*rotate/180;
		var u = Math.cos(angle);
		var v = Math.sin(angle);
		cropX = u * (tx - ltx)/scale - v * (ty - lty)/scale;
		cropY = v * (tx - ltx)/scale + u * (ty - lty)/scale;*/
		return {x:-cropX, y:-cropY, w:cropW, h:cropH, rotate: rotate};
		//exportPhotoData(-cropX, -cropY, cropW, cropH, cropR);
		//console.log(-cropX,-cropY,cropW,cropH,cropR,scale);
	}

	function zoomPhoto(step,cx,cy,withoutRender) {
		var tw_offset, th_offset, tx_offset, ty_offset;
		var centerPercentX = cx==null?(aw/2-tx)/tw:cx;
		var centerPercentY = cy==null?(ah/2-ty)/th:cy;
		//console.log(centerPercentX,centerPercentY,tw,th);
		if (tw > th) {
			tw_offset = step;
			th_offset = step / oscale;
		} else {
			tw_offset = step * oscale;
			th_offset = step;
		}
		var finaleSizeOffset=checkLimitSize(tw_offset,th_offset);
		tw_offset=finaleSizeOffset.x;
		th_offset=finaleSizeOffset.y;
		tx_offset=tw_offset*-centerPercentX;
		ty_offset=th_offset*-centerPercentY;
		//console.log(scale_offset,tx_offset,ty_offset);
		tw += tw_offset;
		th += th_offset;
		tx += tx_offset;
		ty += ty_offset;
		//console.log(tw,th,tx,ty);
		//console.log(cx,cy,tx_offset,ty_offset);
		if(withoutRender==null)renderPhoto();
	}
	var finaleSizePoint={x:0,y:0};
	function checkLimitSize(tw_offset, th_offset) {
		if(oscale>1){
			if(tw+tw_offset<20){
				tw_offset=20-tw;
				th_offset=tw_offset/oscale;
			}
		}else{
			if(th+th_offset<20){
				th_offset=20-th;
				tw_offset=th_offset*oscale;
			}
		}
		finaleSizePoint.x=tw_offset;
		finaleSizePoint.y=th_offset;
		return finaleSizePoint;
	}

	function checkLimitPosition() {
		if(options.fullshow){
			if (rotate == 90 || rotate == 270) {
				if(th<aw){
					if(oscale>1)zoomPhoto((aw-th)*oscale,null,null,true);
					else zoomPhoto((aw-th),null,null,true);
				}
				if(tw<ah){
					if(oscale>1)zoomPhoto((ah-tw),null,null,true);
					else zoomPhoto((ah-tw)/oscale,null,null,true);
				}
				ltx = (th - tw) / 2;
				lty = (tw - th) / 2;
				if(tx>ltx)tx=ltx;
				if(ty>lty)ty=lty;
				if(tx+th<aw+ltx)tx=aw-th+ltx;
				if(ty+tw<ah+lty)ty=ah-tw+lty;
			}else{
				if(tw<aw){
					if(oscale>1)zoomPhoto(aw-tw,null,null,true);
					else zoomPhoto((aw-tw)/oscale,null,null,true);
				}
				if(th<ah){
					if(oscale>1)zoomPhoto((ah-th)*oscale,null,null,true);
					else zoomPhoto(ah-th,null,null,true);
				}
				if(tx>0)tx=0;
				if(ty>0)ty=0;
				if(tx+tw<aw)tx=aw-tw;
				if(ty+th<ah)ty=ah-th;
			}
			setTransition(true);
			renderPhoto();
			window.setTimeout(function(){
				setTransition(false);
			},150);
		}
	}

	function releaseCropArea(){
		var old_aw=aw,old_ah=ah,old_ax=ax,old_ay=ay;
		radio=aw/ah;
		setArea();
		setTransition(true);
		renderCropArea();
		var needScale=aw/old_aw;
		var step;
		if(tw>th)step=tw*needScale-tw;
		else step=th*needScale-th;
		zoomPhoto(step,-tx/tw,-ty/th,true);
		if(options.fullshow){
			checkLimitPosition();
		}else{
			renderPhoto();
			window.setTimeout(function(){
				setTransition(false);
			},150);
		}
	}

	function resetOutSize(){
		if(isHiRes){
			outWidth=photoWidth;
			outHeight=photoHeight;
		}else{
			if (outWidthOption > 0 || outHeightOption > 0 ) {
				if (outWidthOption == 0){
					outWidth = aw * outHeightOption / ah;
					outHeight=outHeightOption;
				}else if (outHeightOption == 0){
					outHeight = ah * outWidthOption / aw;
					outWidth=outWidthOption;
				}else{
					outWidth=outWidthOption;
					outHeight=outHeightOption;
				}
			}else{
				alert("error out size");
			}
			if (thumbWidthOption > 0 || thumbHeightOption > 0 ) {
				if (thumbWidthOption == 0){
					thumbWidth = aw * thumbHeightOption / ah;
					thumbHeight=outHeightOption;
				}else if (thumbHeightOption == 0){
					thumbHeight = ah * thumbWidthOption / aw;
					thumbWidth=thumbWidthOption;
				}else{
					thumbWidth=thumbWidthOption;
					thumbHeight=thumbHeightOption;
				}
			}else{
				thumbWidth=thumbWidthOption;
				thumbHeight=thumbHeightOption;
			}
		}
	}

	function renderPhoto() {
		renderBackgroundPhoto();
		renderCropPhoto();
	}

	function renderBackgroundPhoto() {
		$("#crop_photo_bg").css({
			width: tw + "px",
			height: th + "px",
			transform: "translateX(" + (ax + tx) + "px) translateY(" + (ay + ty) + "px) rotate(" + rotate + "deg)"
		});
	}

	function renderCropPhoto() {
		//console.log(tx,ty,tw,th,aw,ah,rotate);
		$("#crop_photo_inner").css({
			width: tw + "px",
			height: th + "px",
			transform: "translateX(" + (tx-1) + "px) translateY(" + (ty-1) + "px) rotate(" + rotate + "deg)" //
		});
	}

	function renderCropArea() {
		$("#crop_area").css({
			width: aw + "px",
			height: ah + "px",
			transform: "translateX(" + ax + "px) translateY(" + ay + "px)"
		})
	}

	function setTransition(hasTransition){
		if(hasTransition)
			$("#crop_photo_bg, #crop_photo_inner, #crop_area").addClass("crop-transition");
		else
			$("#crop_photo_bg, #crop_photo_inner, #crop_area").removeClass("crop-transition");
	}

	function setFreeRadioDrag(){
		if(freeRadio){
			$(".crop_line_t, .crop_line_r, .crop_line_b, .crop_line_l, .crop_coner_lt, .crop_coner_rt, .crop_coner_lb, .crop_coner_rb").show();
		}else{
			$(".crop_line_t, .crop_line_r, .crop_line_b, .crop_line_l, .crop_coner_lt, .crop_coner_rt, .crop_coner_lb, .crop_coner_rb").hide();
		}
	}

	function loadPhoto(photoURL) {
		loadingUI.play();
		$("#full_photo_label, #full_photo_radio").removeClass("photocropdisable");
		$("#crop_input_photo_tip").hide();
		img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = function () {
			loadingUI.stop();
			photoWidth = img.width;
			photoHeight = img.height;

			$("#crop_photo_bg").attr("src", photoURL);
			$("#crop_photo_inner").attr("src", photoURL);
			hasPhoto = true;
			resetUI();
			restorePhoto();
		};
		img.onerror=function(){
			loadingUI.stop();
			$("#full_photo_label, #full_photo_radio").addClass("photocropdisable");
			$("#crop_input_photo_tip").show();
			alert("Can not load this photo.");
		}
		img.src = photoURL;
	}

	function readFiles(files){
		if (URL) {
			if (files && files.length) {
				file = files[0];
				//console.log(file);
				if (/^image\/\w+/.test(file.type)) {
					var blobURL = URL.createObjectURL(file);
					loadPhoto(blobURL);
				} else {
					window.alert('Please choose an image file.');
				}
			}
		} else {
			window.alert('The browser not support this.');
		}
	}

	function resetUI() {
		if (hasPhoto) {
			$("#crop_area, #crop_photo_bg").show();
			$("#crop_input_photo_tip").hide();
			$("#crop_done_btn").removeClass("photocropdisable");
		} else {
			$("#crop_area, #crop_photo_bg").hide();
			$("#crop_input_photo_tip").css("display","flex");
			$("#crop_done_btn").addClass("photocropdisable");
		}
		if (hasPhoto && isHiRes == false) {
			$("#crop_rotate_btn, #crop_big_btn, #crop_small_btn, #crop_restore_btn, #crop_ratio_btn").removeClass("photocropdisable");
		} else {
			$("#crop_rotate_btn, #crop_big_btn, #crop_small_btn, #crop_restore_btn, #crop_ratio_btn").addClass("photocropdisable");
		}
		if (hideRadio) {
			$("#crop_ratio_btn").hide();
		} else {
			$("#crop_ratio_btn").show();
		}
		if (hideRadio == false && options.supportHiRes) {
			$("#full_photo_radio, #full_photo_label").css("display","inline-block");
		} else {
			$("#full_photo_radio, #full_photo_label").hide();
		}
		if(hideZoom){
			$("#crop_big_btn, #crop_small_btn").hide();
		}else{
			$("#crop_big_btn, #crop_small_btn").show();
		}
	}

	function changeLanguage(){
		if(currentLanguage==options.language)return;

		getDom("[data-i18n]").each(function(){
			var targetLan=i18n[$(this).data("i18n")][options.language];
			if(targetLan==null)targetLan=i18n[$(this).data("i18n")]["en"];
			$(this).html(targetLan);
		})
		currentLanguage=options.language;
	}

	function exportPhotoData(){
		loadingUI.play();
		window.setTimeout(function(){
			var cropData=getCropArea();
			var data,thumb,thumbCanvas;
			if(isHiRes==false){
				var dataCanvas=createPhotoCanvas(img, cropData.x, cropData.y, cropData.w, cropData.h, cropData.rotate, outWidth, outHeight);
				if(options.photoExt=="jpg"){
					data=toDataJpg(dataCanvas);
				}else{
					data=dataCanvas.toDataURL();
				}
				thumbCanvas=exportThumbData(dataCanvas,0,0,outWidth,outHeight,0);
				if(thumbCanvas)thumb=toDataJpg(thumbCanvas);
				dataCanvas=null;
				thumbCanvas=null;
				cropPhotoCallBack(data,thumb);
				//$("body").append(dataCanvas);
				//$("body").append(thumbCanvas);
			}else{
				reader = new FileReader();
				reader.onload = function(e) {
					data=e.target.result;
					thumbCanvas=exportThumbData(img,0,0,outWidth,outHeight,0);
					if(thumbCanvas)thumb=toDataJpg(thumbCanvas);
					thumbCanvas=null;
					cropPhotoCallBack(data,thumb);
					//$("body").append(thumbCanvas);
				}
				reader.readAsDataURL(file);
			}
			//console.log(data);
		},50);
	}

	function toDataJpg(canvas){
		var backgroundColor="#ffffff";
		var context = canvas.getContext("2d");
		//var compositeOperation = context.globalCompositeOperation;
		context.globalCompositeOperation = "destination-over";
		context.fillStyle = backgroundColor;
		context.fillRect(0,0,canvas.width,canvas.height);
		var imageData=canvas.toDataURL("image/jpeg",0.99);
		return imageData;
	}


	function exportThumbData(source,x,y,w,h,rotate){
		if(thumbWidth==0 || thumbHeight==0)return null;
		var ttw = Math.max(Math.ceil(outWidth * thumbHeight / outHeight), thumbWidth);
		var tth = Math.max(Math.ceil(outHeight * thumbWidth / outWidth), thumbHeight);
		var thumbCanvas=createPhotoCanvas(source, x, y, w, h, rotate, ttw, tth);
		thumbCanvas=createThumbCanvas(thumbCanvas,ttw,tth,thumbWidth,thumbHeight);
		return thumbCanvas;
	}

	function cropPhotoCallBack(data,thumb){
		var cropData;
		if(options.needArrayData){
			cropData={};
			options.serverdata.data=[cropData];
		}else{
			cropData=options.serverdata;
		}
		cropData.data=data.substr(data.indexOf(",")+1);
		if(thumb)cropData.thumb=thumb.substr(thumb.indexOf(",")+1);
		cropData.isHiRes=isHiRes;
		cropData.ext="."+options.photoExt;
		if(options.server==null){
			loadingUI.stop();
			closeCropWindow();
			if(options.needArrayData){
				options.success([cropData]);
			}else{
				options.success(cropData);
			}
		}else{
			$.post(options.server, options.serverdata, function(response){
				loadingUI.stop();
				closeCropWindow();
				options.success(response);
			})
		}
	}

	function createPhotoCanvas(source, x, y, w, h, rotate, outWidth, outHeight) {
		//console.log(x, y, w, h, rotate, outWidth, outHeight);
		//$("canvas").remove();
		var canvas = document.createElement("canvas");
		var r=Math.max(w,h);
		if(rotate==90 || rotate==270){
			canvas.width = h;
			canvas.height = w;
		}else{
			canvas.width = w;
			canvas.height = h;
		}
		var ctx = canvas.getContext("2d");
		ctx.translate(w/2,h/2);
		ctx.rotate(rotate*Math.PI/180);
		ctx.translate(-w/2,-h/2);
		if(rotate==90){
			ctx.drawImage(source, x, y, w, h, (w-h)/2, (w-h)/2, w, h);
		}else if(rotate==270){
			ctx.drawImage(source, x, y, w, h, (h-w)/2, (h-w)/2, w, h);
		}else{
			ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
		}
		var outCanvas  = _cropscale({width: Math.floor(outWidth), height: Math.floor(outHeight)}, canvas);
		//console.log(outCanvas);
		//$("body").append(canvas);
		//$("body").append(outCanvas);
		canvas=null;
		return outCanvas;
	}

	function createThumbCanvas(source,ow,oh,aw,ah){
		var canvas = document.createElement("canvas");
		canvas.width = aw;
		canvas.height = ah;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(source, (ow-aw)/2, (oh-ah)/2, aw, ah, 0, 0, aw, ah);
		return canvas;
	}

	function closeCropWindow() {
		hasPhoto = false;
		$("#full_photo_radio").attr('checked', false);
		$("#full_photo_radio")[0].checked = false;
		isHiRes = false;
		resetUI();
		htmlWrap.remove();
		$("#"+c3photocropinput).off("change").remove();
	}

	function createHtmlElement(){
		var htmlTemp='<div class="crop-mask"></div>'+
					'<div class="crop-window crop-center photocrop-disable-select">'+
						'<div class="crop-heard">'+
							'<div class="photocropbutton" id="crop_close_btn"></div>'+
							'<span data-i18n="title">Crop Photo</span>'+
							'<div class="photocropbutton" id="crop_done_btn"></div>'+
						'</div>'+
						'<div class="crop-body">'+
							'<img id="crop_photo_bg"/>'+
							'<div id="crop_drag" class="crop-box crop-drag"></div>'+
							'<div id="crop_area" class="crop-box">'+
								'<div class="crop_area_box">'+
									'<img id="crop_photo_inner" class="crop-box photocropoverlay"/>'+
								'</div>'+
								'<div class="crop_line_horizontal photocropoverlay"></div>'+
								'<div class="crop_line_vertical photocropoverlay"></div>'+
								'<div class="crop_line_t"></div><div class="crop_line_r"></div>'+
								'<div class="crop_line_b"></div><div class="crop_line_l"></div>'+
								'<div class="crop_coner_lt"></div><div class="crop_coner_rt"></div>'+
								'<div class="crop_coner_lb"></div><div class="crop_coner_rb"></div>'+
							'</div>'+
							'<div id="crop_input_photo_tip" contenteditable><span data-i18n="'+(_cropIsMobile()?'tipMobile':'tip')+'">Drop image here or click browse</span></div>'+
						'</div>'+
						'<div class="crop-tool">'+
							'<input type="radio" id="full_photo_radio"/><label id="full_photo_label" data-i18n="full">Full Photo</label>'+
							'<div class="photocropbutton" id="crop_change_btn"></div>'+
							'<div class="photocropbutton" id="crop_rotate_btn"></div>'+
							'<div class="photocropbutton" id="crop_big_btn"></div>'+
							'<div class="photocropbutton" id="crop_small_btn"></div>'+
							'<div class="photocropbutton" id="crop_restore_btn"></div>'+
							'<div>'+
								'<div class="photocropbutton" id="crop_ratio_btn"></div>'+
								'<ul id="crop_ratio_select" class="photocrop-disable-select photocrop-hide">'+
									'<li data-radio="-1" data-i18n="free">Free ratio</li>'+
									'<li data-radio="0" data-i18n="origin">Origin ratio</li>'+
									'<li data-radio="1">1:1</li>'+
									'<li data-radio="1/2">1:2</li>'+
									'<li data-radio="2/3">2:3</li>'+
								'</ul>'+
							'</div>'+
						'</div>'+
					'</div>'
		return htmlTemp;
	}

	this.init = function () {
		$("body").append('<div id="crop_container"></div>');
		htmlWrap=$(createHtmlElement())

		var dropbox = getDom("#crop_input_photo_tip")[0];    
		dropbox.addEventListener("dragenter", prevent, false);    
		dropbox.addEventListener("dragover", prevent, false);
		dropbox.addEventListener("drop", dropHandle, false);  
		function dropHandle(e) {
			prevent(e);
			if(e.dataTransfer.files.length>0){
				readFiles(e.dataTransfer.files);
			}else{
				var dataTransfer=e.dataTransfer||e.originalEvent.dataTransfer;
				var object = $('<div/>').html(dataTransfer.getData('text/html')).contents();
				if (object) {
					var insert_pic =  object.closest('img').prop('src');
					if(insert_pic){
						loadPhoto(insert_pic);
						return;
					}
				}
				var imageUrl = dataTransfer.getData('text');
				if(imageUrl){
					loadPhoto(imageUrl);
				}
			}
		}
		getDom("#crop_input_photo_tip")[0].addEventListener('paste', function(e) {
			prevent(e);
			var cbd = e.clipboardData;
			var ua = window.navigator.userAgent;
			// 如果是 Safari 直接 return
			if ( !(e.clipboardData && e.clipboardData.items) ) {
				return;
			}
			// Mac平台下Chrome49版本以下 复制Finder中的文件的Bug Hack掉
			if(cbd.items && cbd.items.length === 2 && cbd.items[0].kind === "string" && cbd.items[1].kind === "file" &&
				cbd.types && cbd.types.length === 2 && cbd.types[0] === "text/plain" && cbd.types[1] === "Files" &&
				ua.match(/Macintosh/i) && Number(ua.match(/Chrome\/(\d{2})/i)[1]) < 49){
				return;
			}
			for(var i = 0; i < cbd.items.length; i++) {
				var item = cbd.items[i];
				if(item.kind == "file"){
					var blob = item.getAsFile();
					if (blob.size > 0) {
						readFiles([blob]);
						return;
					}
				}
			}
		})
		function prevent(e) {    
			e.stopPropagation();
			e.preventDefault();
		}
		$("#crop_container").on("click", "#crop_close_btn", function () {
			closeCropWindow();
		});
		$("#crop_container").on("click", "#crop_done_btn", function () {
			exportPhotoData();
		});
		getDom("#full_photo_label, #full_photo_radio").addClass("photocropdisable");
		$("#crop_container").on("click", "#full_photo_label, #full_photo_radio", function (e) {
			var checkedState = $("#full_photo_radio").attr('checked');
			if (checkedState == 'checked' || checkedState == "true") {
				$("#full_photo_radio").attr('checked', false);
				$("#full_photo_radio")[0].checked = false;
				isHiRes = false;
			} else {
				$("#full_photo_radio").attr('checked', true);
				$("#full_photo_radio")[0].checked = true;
				isHiRes = true;
			}
			lockRadio=false;
			restorePhoto();
			resetUI();
		});
		$("#crop_container").on("click", "#crop_change_btn, #crop_input_photo_tip", function () {
			$("._c3photocropinputimage").click();
		});
		$("#crop_container").on("click", "#crop_rotate_btn", function () {
			rotate += 90;
			if (rotate == 360) rotate = 0;
			restorePhoto(rotate);
		});
		var zoomTimer;
		$("#crop_container").on(_cropMouseDown, "#crop_big_btn", function () {
			window.clearInterval(zoomTimer);
			zoomTimer=window.setInterval(zoomPhoto,50,10);
		});
		$("#crop_container").on(_cropMouseDown, "#crop_small_btn", function () {
			window.clearInterval(zoomTimer);
			zoomTimer=window.setInterval(zoomPhoto,50,-10);
		});
		$("#crop_container").on(_cropMouseUp,function(){
			window.clearInterval(zoomTimer);
			if(zoomTimer)checkLimitPosition();
			zoomTimer=null;
		});
		$("#crop_container").on("click", "#crop_restore_btn", function () {
			restorePhoto();
		});
		$("#crop_container").on("click", "#crop_ratio_btn", showRatioSelect);
		function showRatioSelect(){
			$("#crop_container").off("click", "#crop_ratio_btn", showRatioSelect);
			$("#crop_ratio_select").show();
			window.setTimeout(function(){
				$(document).on("click",hideRatioSelect);
			},50);
		}
		function hideRatioSelect(){
			$(document).off("click",hideRatioSelect);
			$("#crop_ratio_select").hide();
			$("#crop_container").on("click", "#crop_ratio_btn", showRatioSelect);
		}
		$("#crop_container").on("click", "#crop_ratio_select li", function () {
			radio=eval($(this).data("radio"));
			lockRadio=radio>0;
			freeRadio=radio==-1;
			restorePhoto(rotate);
		});
		var mouseWheelNumber;
		$("#crop_container").on("mousewheel", "#crop_drag, #crop_area", function(e) {
			prevent(event);
			var delta = e.wheelDelta || (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) || (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));
			zoomPhoto(delta>0?20:-20);
			window.clearTimeout(mouseWheelNumber);
			window.setTimeout(checkLimitPosition,100);
		});
		/*var mc = new Hammer.Manager(document.getElementById('crop_container'));
		var pinch = new Hammer.Pinch();
		mc.add([pinch]);
		mc.on("pinch", function(ev) {
			console.log(ev);
		});*/
		_cropDrag.init({
			handler: [getDom("#crop_drag")[0], getDom(".crop_area_box")[0]],
			root: getDom("#crop_photo_bg")[0],
			onDrag: function (x, y) {
				if(x!=null && y!=null){
					tx = x - ax;
					ty = y - ay;
					renderCropPhoto();
				}
			},
			onDragEnd: function (x, y) {
				checkLimitPosition();
			}
		});
		_cropDrag.init({
			handler: [
				getDom(".crop_line_t")[0],
				getDom(".crop_line_r")[0],
				getDom(".crop_line_b")[0],
				getDom(".crop_line_l")[0],
				getDom(".crop_coner_lt")[0],
				getDom(".crop_coner_rt")[0],
				getDom(".crop_coner_lb")[0],
				getDom(".crop_coner_rb")[0],
			],
			isLock: true,
			onDrag: function (x, y) {
				var target=$(this);
				if(target.hasClass("crop_line_t")||target.hasClass("crop_coner_lt")||target.hasClass("crop_coner_rt")){
					if(ah>20+y && ah<ch+y && ay>options.gap-y){
						ay+=y;
						ah-=y;
						ty-=y;
					}
				}
				if(target.hasClass("crop_line_b")||target.hasClass("crop_coner_lb")||target.hasClass("crop_coner_rb")){
					if(ah>20-y && ah<ch-y && ay+ah<ch+options.gap-y){
						ah+=y;
					}
				}
				if(target.hasClass("crop_line_l")||target.hasClass("crop_coner_lt")||target.hasClass("crop_coner_lb")){
					if(aw>20+x && aw<cw+x && ax>options.gap-x){
						ax+=x;
						aw-=x;
						tx-=x;
					}
				}
				if(target.hasClass("crop_line_r")||target.hasClass("crop_coner_rt")||target.hasClass("crop_coner_rb")){
					if(aw>20-x && aw<cw-x && ax+aw<cw+options.gap-x){
						aw+=x;
					}
				}
				renderCropArea();
				renderCropPhoto();
			},
			onDragEnd: function () {
				releaseCropArea();
			}
		});
		loadingUI=new SVGLoading({textColor:"#ccc",textDefault:"waiting"});
		//loadingUI.play();
	}

	function getDom(selection){
		return $(htmlWrap.find(selection));
	}

	this.crop = function (_option) {
		options = $.extend($.extend({}, defaultOption), _option);
		var outwh = options.cropSize.split("x");
		if (outwh[0] == "") outWidthOption = 0;
		else outWidthOption = parseInt(outwh[0]);
		if (outwh[1] == "") outHeightOption = 0;
		else outHeightOption = parseInt(outwh[1]);

		var thumbwh = options.thumbSize.split("x");
		if (thumbwh[0] == "") thumbWidthOption = 0;
		else thumbWidthOption = parseInt(thumbwh[0]);
		if (thumbwh[1] == "") thumbHeightOption = 0;
		else thumbHeightOption = parseInt(thumbwh[1]);

		if (outWidthOption > 0 && outHeightOption > 0) {
			radio = outWidthOption / outHeightOption;
			lockRadio = true;
			hideRadio = true;
		} else {
			freeRadio = true;
			lockRadio = false;
			hideRadio = false;
		}
		$("#crop_container").append(htmlWrap);
		c3photocropinput="c3photocropinput"+parseInt(Math.random()*100000000);
		$("#crop_container").append('<input id="'+c3photocropinput+'" class="_c3photocropinputimage" type="file" accept="image/*" style="display: none;"/>');
		resetUI();
		changeLanguage();

		$("#"+c3photocropinput).on("change", function () {
			readFiles(this.files);
		});
		//console.log(outWidth, outHeight, thumbWidth, thumbHeight);
		cw = $(".crop-body").width() - options.gap * 2;
		ch = $(".crop-body").height() - options.gap * 2;
		if (options.photoURL != null) loadPhoto(options.photoURL);
	}
	this.init();

	return this;
};
var C3PhotoCrop = {
	_C3PhotoCropInstance:null,
	crop: function (option) {
		if(C3PhotoCrop._C3PhotoCropInstance==null)
			C3PhotoCrop._C3PhotoCropInstance=new _C3PhotoCropInstance();
		C3PhotoCrop._C3PhotoCropInstance.crop(option);
	}
};
if (typeof module !== 'undefined' && typeof exports === 'object') {
	module.exports = C3PhotoCrop;
} else {
	window.C3PhotoCrop = C3PhotoCrop;
}

/*export {
	_C3PhotoCropInstance:null,
	crop: function (option) {
		if(_C3PhotoCropInstance==null)
			_C3PhotoCropInstance=new _C3PhotoCropInstance();
		_C3PhotoCropInstance.crop(option);
	}
}*/