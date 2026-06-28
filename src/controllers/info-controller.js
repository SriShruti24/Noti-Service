const {StatusCodes}=require('http-status-codes');
const info =(req,res)=>{
    return res.status(StatusCodes.OK).json({
        success:true,
        message:'API IS LIVE',
        error:{},
        data:{
            dbHost: process.env.DB_HOST || 'not-set',
            dbPort: process.env.DB_PORT || 'not-set',
            dbName: process.env.DB_NAME || 'not-set',
            dbUser: process.env.DB_USER || 'not-set'
        }
    });
}
module.exports={
    info
}