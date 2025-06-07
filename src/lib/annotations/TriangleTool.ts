import { WebViewerInstance } from '@pdftron/webviewer';

export async function registerTriangleAnnotation(instance: WebViewerInstance) {
  const { Core } = instance;
  const { Annotations, Tools, Math, documentViewer } = Core;

  // 🟡 Import các script (dạng IIFE) để gắn factory vào window
  await import('@/lib/annotations/triangle-annotation.js');
  await import('@/lib/annotations/triangle-create-tool.js');
  await import('@/lib/annotations/triangle-selection-model.js');
  await import('@/lib/annotations/triangle-control-handle.js');

  // 🟢 Truy cập từ window do các script tự gán vào đó
  const TriangleAnnotation = window.TriangleAnnotationFactory.initialize(Annotations, Math);
  const TriangleCreateTool = window.TriangleCreateToolFactory.initialize(Tools, TriangleAnnotation);
  const TriangleSelectionModel = window.TriangleSelectionModelFactory.initialize(Annotations, Math);

  // Gán selection model nếu cần (tùy từng phiên bản WebViewer)
  TriangleAnnotation.prototype.selectionModel = TriangleSelectionModel;

  // Đăng ký annotation type
  documentViewer
    .getAnnotationManager()
    .registerAnnotationType(TriangleAnnotation.prototype.elementName, TriangleAnnotation);

  console.log('Registering TriangleAnnotation');
  console.log('TriangleAnnotation:', TriangleAnnotation);
  console.log('SelectionModel:', TriangleSelectionModel);
  console.log('Tool object:', new TriangleCreateTool(documentViewer));
  console.log('elementName:', TriangleAnnotation.prototype.elementName);

  // Đăng ký tool với WebViewer UI
  instance.UI.registerTool(
    {
      toolName: 'AnnotationCreateTriangle',
      toolObject: new TriangleCreateTool(documentViewer),
      buttonImage:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M12 7.77L18.39 18H5.61L12 7.77M12 4L2 20h20L12 4z"/>' +
        '</svg>',
      buttonName: 'triangleToolButton',
      tooltip: 'Triangle',
    },
    TriangleAnnotation,
    (annot) =>
      annot?.Subject === 'Triangle' &&
      annot.elementName === TriangleAnnotation.prototype.elementName
  );
}
