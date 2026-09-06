const mongoose=require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        firstName:{
            type: String,
            required: true,
            trim: true,
            minLength : 3,
            maxLength : 50,
        },

        lastName:{
            type:String,
            required: true,
            trim:true,
            minLength : 3,
            maxLength : 50,
        },

        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password:{
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre('save', async function () {
  if (this.isModified('password')){
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.checkPassword= async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('user', userSchema);