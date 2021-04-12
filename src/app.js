const path= require('path');
const webby = require('./webby.js');
const app = new webby.App();

app.use(webby.static(path.join(__dirname, '..', "public")));

//http://localhost:3000/
// GET / - responds with a page that links to /gallery… 
// this should be implemented using app.get
app.get('/', (req, res) => {
    res['Content-Type']= 'text/html';
    res.status(200);
    res.send(
    `<html>
    <head>
    <link rel="stylesheet" href="/css/styles.css">
    </head>
    <body>
    <h1>Dogs Are THE BEST
    </h1>
    <a href="/gallery" >Let's see some cute doggies 
    </a>
    </body>
    </html>`);
  });

//http://localhost:3000/gallery
//GET /gallery - responds with a page that contains a random number of random images of an animal … this should be implemented using app.get
// there should be 1 to 4 images displayed one of the following: /img/animal1.jpg through /img/animal4.jpg
// they must all be .jpg
// the same picture can show up twice
app.get('/gallery', (req,res) => {
  let animals = ['/img/animal1.jpg', '/img/animal2.jpg', '/img/animal3.jpg', '/img/animal4.jpg'];
  let displayC=0;
  displayC = Math.floor(Math.random()*10);
  
  res['Content-Type']='text/html';
  let h_contents='';
  let pcount;
  if(displayC %4===0){ 
    h_contents= '<h1>Here are FOR dogs!</h1>'; 
    pcount= 4;
  }
  else if(displayC %4 ===1){ 
    h_contents= '<h1>Here is A dog!</h1>'; 
    pcount=1;}
  else if(displayC %4 ===2){ 
  h_contents = '<h1>Here are TOO dogs!</h1>'; 
  pcount=2;} 
  else if(displayC %4 ===3){ 
    h_contents = '<h1>Here are TREE dogs!</h1>'; 
    pcount=3;} 
  
  let pics = '';
  for (let i = 0; i < pcount; i++) {
    pics += '<img src="'+ animals[Math.floor(Math.random()*10)% 4] +'">';
  } 

  //create animals based on display c 
  res.status(200);
  res.send('<html><head><link rel="stylesheet" href="/css/styles.css"></head><body>'+h_contents+pics+'</body></html>');
});



//http://localhost:3000/pics
//GET /pics - redirects to /gallery …
// this should be implemented using app.get and with the callback setting the write status code and headers for a permanent redirect (check the redirect article on mdn)
// note that after the redirect, the browser address bar will show the new address
// (that is, the browser will be coerced into making another request to the url that it is being redirected to)
app.get('/pics', (req, res) => {
  res.set("Location", "/gallery");
  res.send('Redirecting to Doggie Gallery~ :)');
  res.status(301);
  
});

//GET /img/animal1.jpg - /img/animal4.jpg - serves up four images of an animal
app.get('/img/animal1.jpg', (req,res) => {}); //2nd arg : the callback function
app.get('/img/animal2.jpg', (req,res) => {});
app.get('/img/animal3.jpg', (req,res) => {});
app.get('/img/animal4.jpg', (req,res) => {});

//GET /css/styles.css - serves up a stylesheet based on a static file contained in public/css/
app.get('/css/styles.css', (req,res) => {});


app.listen(3000);
