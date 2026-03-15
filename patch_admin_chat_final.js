const fs = require('fs');

const FILE_PATH = 'resources/js/Admin/Pages/LiveChat/Index.jsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// Add attachments state
if (!content.includes('const [attachments, setAttachments] = useState([]);')) {
    content = content.replace(
        "const [draftBody, setDraftBody] = useState('');",
        `const [draftBody, setDraftBody] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);`
    );
}

// Add Drop logic
if (!content.includes('const handleDrop =')) {
    content = content.replace(
        "const handleSend = async () => {",
        `const handleFileUpload = async (files) => {
        if (!files || files.length === 0 || !activeConvId) return;
        setUploadingFiles(true);
        const uploadedAttachments = [];
        
        try {
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData(const fs = require('fs');

const FILE_PA',
const FILE_PATH = 'reso   let content = fs.readFileSync(FILE_PATH, 'utf8');

// Add attacnv
// Add attachments state
if (!content.includes(   if (!content.includes('
     content = content.replace(
        "const [draftBody, setDraftBody] = useS?.        "const [draftBody, sef-        `const [draftBody, setDraftBody] = useState('');
 '    const [attachments, setAttachments] = useState([]);      const [uploadingFiles, setUploadingFiles] = useSta      );
}

// Add Drop logic
if (!content.includes('const handleD a}

//res.jif (!content.inc      content = content.replace(
        "const          "const handleSend = a          `const handleFileUpload = async (f..        if (!files || files.length === 0 || !active          setUploadingFiles(true);
        const uploadedAttachmentll        const uploadedAttachmenes        
        try {
            foran       Ov         => {
                const formData = new FormData(conston
const FILE_PA',
const FILE_PATH = 'reso   let content = fs.readFileSy;
 const FILE_PATro
// Add attacnv
// Add attachments state
if (!content.includes(   if (!conh >// Add attach  if (!content.includes( at     content = content.replace(
        "const an        "const [draftBody, set;
 '    const [attachments, setAttachments] = useState([]);      const [uploadingFiles, setUploadingFiles] = useSta      );
}

// Add Drody}

// Add Drop logic
if (!content.includes('const handleD a}

//res.jif (!content.inc      content = content.replace(
  ad
coif (!content.in.re
//res.jif (!content.inc      content { b        "const          "const handleSend = a         y:        const uploadedAttachmentll        const uploadedAttachmenes        
        try {
            foran       Ov         => {
                const formData = new FormDatana        try {
            foran       Ov         => {
                consls    n                         const formData = new Fr const FILE_PA',
const FILE_PATH = 'reso   let contenntconst FILE_PATon const FILE_PATro
// Add attacnv
// Add attachments s
 // Add attacnv
/ss// Add attacherif (!content.includesrk:b        "const an        "const [draftBody, set;
 '    const [attachments, setAttachments] = useState([]);'\ '    const [attachments, setAttachments] = userd}

// Add Drody}

// Add Drop logic
if (!content.includes('const handleD a}

//res.jif (!content.inc      content = cont ''}\
// Add Dropr={if (!conteOver} on
//res.jif (!content.inc      content r a  ad
coif (!content.in.re
//res.jif (!content.inc     atcoihm//res.jif (!contentat        try {
            foran       Ov         => {
                const formData = new FormDatana        try {
            foran       Ov         => {
       {attachmen             i                const formData = new F              foran       Ov         => {
                conem                consls    n           y-const FILE_PATH = 'reso   let contenntconst FILE_PATon const FILE_PATro
// Add attacnv
//   // Add attacnv
// Add attachments s
 // Add attacnv
/ss// Add attacher')// Add attach   // Add attacnv
/ss  /ss// Add atta   '    const [attachments, setAttachments] = useState([]);'\ '    const [attachments, setAt-1
// Add Drody}

// Add Drop logic
if (!content.includes('const handleD a}

//res.jif (!content.inc      cont   
// Add Drop   if (!content.inc  
//res.jif (!content.inc      content  te// Add Dropr={if (!conteOver} on
//res.jif (!co  //res.jif (!content.inc      co  coif (                                       //res.jif (!content="            foran       Ov         => {
                const formDa/s                const formData = new F              foran       Ov         => {
       {attachmen           {attachmen             i       to                conem                consls    n           y-const FILE_PATH = 'reso   let contenntconst FILE-c// Add attacnv
//   // Add attacnv
// Add attachments s
 // Add attacnv
/ss// Add attacher')// Add attach   // Add attacnv
/ss  /ss  //   // Add ali// Add attachmentshm // Add attacnv
/ssil/ss// Add atta =/ss  /ss// Add atta   '    const [attachments, se  // Add Drody}

// Add Drop logic
if (!content.includes('const handleD a}

//res.jif (!content.inc      cont   
/  
// Add Drop   if (!content.inc  
//res.jif (!content.inc      cont   
   // Add Drop   if (!content.inc  
//>
//res.jif (!content.inc      co  //res.jif (!co  //res.jif (!content.inc      co  coif (                                  const formDa/s                const formData = new F              foran       Ov         => {
       {attachmen           {attachmen     ss       {attachmen           {attachmen             i       to                conem                consls      //   // Add attacnv
// Add attachments s
 // Add attacnv
/ss// Add attacher')// Add attach   // Add attacnv
/ss  /ss  //   // Add ali// Add attachm                        Uploading files.// Add attachments   // Add attacnv
/ss  /ss// Add atta  /ss  /ss  //   // Add ali// Add attachmentshm // on/ssil/ss// Add atta =/ss  /ss// Add atta   '    const [atta c
// Add Drop logic
if (!content.includes('const handleD a}

//res.jif (!conder border-gif (!content.in   
//res.jif (!content.inc      cont   
   /  
// Add Drop   if (!content.inc sN//e=//res.jif (!content.inc      co b   // Add Drop   if (!content.inc   M//>
//res.jif (!content.inc      cge/ fi       {attachmen           {attachmen     ss       {attachmen           {attachmen             i       to                conem                consls      //   // Add attacnv
// Add attachments s
 // Add attacnv
/s0 // Add attachments s
 // Add attacnv
/ss// Add attacher')// Add attach   // Add attacnv
/ss  /ss  //   // Add ali// Add attachm                        Uploading files.// Add-g // Add attacnv
/ssay/ss// Add atter:/ss  /ss  //   // Add ali// Add attachm            /ss  /ss// Add atta  /ss  /ss  //   // Add ali// Add attachmentshm // on/ssil/ss// Add atta =/ss  /ss// Add atta um// Add Drop logic
if (!content.includes('const handleD a}

//res.jif (!conder border-gif (!content.in   
//res.jif (!content.inc      if (!content.inc  
//res.jif (!conder border-gif (!conte ty//res.jif (!content.inc      cont   
   /  
     /  
// Add Drop   if (!content.i 
// Ad  //res.jif (!content.inc      cge/ fi       {attachmen           {attachmen     ss       {attachmen           "h// Add attachments s
 // Add attacnv
/s0 // Add attachments s
 // Add attacnv
/ss// Add attacher')// Add attach   // Add attacnv
/ss  /ss  //   // Add ali// Add attachm                        Uploading           // Add attacnv
/s0  /s0 // Add att ) // Add attacnv
/ss// A d/ss// Add attan /ss  /ss  //   // Add ali// Add attach(
    /<span /ssay/ss// Add atter:/ss  /ss  //   // Add ali// Add attachm            /ss  /ss// Add atta  /ss  /ssa if (!content.includes('const handleD a}

//res.jif (!conder border-gif (!content.in   
//res.jif (!content.inc      if (!content.inc  
//res.jif (!conder border-gif (!conte ty//res.jif (!content.inc     .m
//res.jif (!conder border-gif (!conteont//res.jif (!content.inc      if (!content.ins\//res.jif (!conder border-gif (!conte ty//res.ct   /  
     /  
// Add Drop   if (!content.i 
// Ad  //res.jif (!content.in(!     nt// Add es// Ad  //res.jif (!content.i c // Add attacnv
/s0 // Add attachments s
 // Add attacnv
/ss// Add attacher')// Add attach   // Add attacnv
/ss  /ss  //   // Add ali// Ad.');
