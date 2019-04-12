# PhotoCrop

PhotoCrop is JS library for photo crop  
PhotoCrop 是一个裁剪图片的 js 组件  
GitHub Pages: https://github.com/fengshangbin/ListView

# 设计理念

不依赖第三方框架，也无侵入，功能全面，使用方便

# 特点及优势

1. 支持 PC 和移动端, UI 简单清晰
2. 功能全面，支持原图输出，轻界面模式，自定义宽高比例
3. 图片缩放无锯齿
4. 使用简单,支持移动端的手势

# 如何使用

引入 js 文件

```html
<script src="c3photocrop.js"></script>
```

```
C3PhotoCrop.crop({
    cropSize: '300x250',
    success: function(data) {
        img.src = 'data:image/jpeg;base64,' + data.data;
    }
});
```

[示例](http://www.fengshangbin.com/html/c3photocrop/)  
示例二维码  
![示例二维码](http://www.fengshangbin.com/html/c3photocrop/qrcode.png)

# 更多功能

默认参数

```
var defaultOption = {
  cropSize: '0x0', //裁剪尺寸
  thumbSize: '0x0', //缩图尺寸
  defaultPhoto: null, //默认需要裁剪的图片，可以为图片网址，也可以为File文件
  success: null, //回调函数
  liteMode: false, //轻模式，直接默认居中裁剪，用户看不到裁剪界面
  multiple: false, //多选模式，仅当liteMode为true并且默认图片为null时才可以开启
  photoExt: 'jpg', //输出格式（使用原图时此配置无效）
  language: 'en', //语言
  supportHiRes: true, //是否支持输出高清原图
  supportRatio: true, //是否支持自选宽高比
  ratio: ['1:1', '1:2', '2:3'], //自选宽高比的选项
  fullshow: true, //是否强制填满裁剪区域
  gap: 20, //边距
  mimimum: 20
};
```

裁剪后返回的数据(如果启用多图模式 返回的则是一个数组)

```
{
    data  //裁剪后图片base64字符串
    thumb //缩图base64
    isHiRes //是否是高清原图
    ext //输出图片的格式
    originalFile //裁剪图片源
  }
```
