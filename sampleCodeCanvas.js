const { createCanvas, loadImage } = require('canvas')
const canvas = createCanvas(805, 487)
const ctx = canvas.getContext('2d')
const fs = require('fs');


const out = fs.createWriteStream(__dirname + '/test.png')



// Draw cat with lime helmet
loadImage('etalus.png').then((image) => {

//-----------


  var dArr = [-1,-1, 0,-1, 1,-1, -1,0, 1,0, -1,1, 0,1, 1,1], // offset array
  s = 10,  // thickness scale
  i = 0,  // iterator
  x = 30,  // final position
  y = 30;

  // draw images at offsets from the array scaled by s
  for(; i < dArr.length; i += 2) ctx.drawImage(image, x + dArr[i]*s, y + dArr[i+1]*s);

  // fill with color
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = "green";
  ctx.fillRect(0,0,canvas.width, canvas.height);

  // draw original image in normal mode
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(image, x, y);

  // Write "Awesome!"
  let texte = "Slaking"
  ctx.font = '78px roa_m_bold_loc21'
  //ctx.rotate(0.1)
  ctx.fillStyle = 'black';
  ctx.fillText(texte, 76, 124)
  ctx.lineWidth = 3
  ctx.strokeStyle = 'white';
  ctx.strokeText(texte, 76, 124)

  // Draw line under text
  //var text = ctx.measureText(texte)

  loadImage('/home/frik/AwA/Fitxers/SVGA/Fichas BR/Reverse19.png').then((bg) => {
    ctx.globalCompositeOperation = "destination-over";
    ctx.drawImage(bg, 0, 0);
    //ctx.fillStyle = "gray";
    //ctx.fillRect(0,0,canvas.width,canvas.height);
      
      
    const stream = canvas.createPNGStream()
    stream.pipe(out)
    out.on('finish', () =>  console.log('The PNG file was created.'))
  //console.log('<img src="' + canvas.toDataURL() + '" />')
})})
