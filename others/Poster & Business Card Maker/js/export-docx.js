import { Document, ImageRun, Packer, Paragraph } from 'https://esm.sh/docx@8.5.0';

function mmToTwips(mm) {
  return Math.round(mm * 56.6929133858);
}

function pxToDocxSize(px, dpi) {
  return Math.round((px / dpi) * 96);
}

window.exportAsDocx = async function exportAsDocx(canvas, asset) {
  const blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });

  if (!blob) {
    throw new Error('Could not render image for DOCX export.');
  }

  const arrayBuffer = await blob.arrayBuffer();
  const widthMm = asset.physicalMm.width;
  const heightMm = asset.physicalMm.height;
  const imageWidth = pxToDocxSize(asset.width, asset.dpi);
  const imageHeight = pxToDocxSize(asset.height, asset.dpi);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: mmToTwips(widthMm),
              height: mmToTwips(heightMm),
            },
            margin: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
          },
        },
        children: [
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
              new ImageRun({
                data: arrayBuffer,
                transformation: {
                  width: imageWidth,
                  height: imageHeight,
                },
              }),
            ],
          }),
        ],
      },
    ],
  });

  const docxBlob = await Packer.toBlob(doc);

  return {
    blob: docxBlob,
    filename: `${asset.filename}.docx`,
    format: 'DOCX',
    size: docxBlob.size,
    warning: null,
  };
};
