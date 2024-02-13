import multer from "multer";

// read multer from github, disk storage use

const storage = multer.diskStorage({

  // destination tells about folder to which fle is going to saved
    destination: function (req, file, cb) {
      cb(null, '/public/temp')// first param for error handling
    },

    //filename :The name of the file within the destination	
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
// export const upload = multer({ storage: storage })

export const upload = multer({ storage,})

