export var defaultOption = {
  cropSize: '0x0',
  thumbSize: '0x0',
  defaultPhoto: null, //默认需要裁剪的图片，可以为图片网址，也可以为File文件
  success: null,
  liteMode: false, //轻模式，直接默认居中裁剪，用户看不到裁剪界面
  multiple: false, //多选模式，仅当liteMode为true并且默认图片为null时才可以开启
  photoExt: 'jpg',
  language: 'en',
  supportHiRes: true,
  supportRatio: true,
  ratio: ['1:1', '1:2', '2:3'],
  fullshow: true,
  title: null,
  openCamera: false, //直接打开摄像头拍照，只有非多选模式并且移动端生效
  gap: 20,
  mimimum: 20
};
