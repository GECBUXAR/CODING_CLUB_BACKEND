import Admin from '../model/admin.model.js';
import Event from '../model/event.model.js';
import nodemailer from 'nodemailer';
import User from '../model/user.model.js';



export const asyncHandler =(fn)=>{
    return  (req,res,next) =>{
           Promise.resolve(fn(req,res,next)).catch((err)=>next(err))
       }
   
}

const adminSecretKey = '1234567890';
export const createAdmin = asyncHandler(async (req, res) => {
    try {
    const { name, email, secretKey } = req.body;
    if (secretKey !== adminSecretKey) {
        return res.status(403).json({ message: 'Invalid secret key.' });
    }
    const admin = new Admin({ name, email, role: 'admin' });
    await admin.save();
    res.status(201).json(admin);
}catch(error){
    res.status(500).json({ message: 'Internal server error.' });
}
});  

export const loginAdmin = asyncHandler(async (req, res) => {
    try {
    const { email, secretKey } = req.body;
            if (secretKey !== adminSecretKey) {
        return res.status(403).json({ message: 'Invalid secret key.' });
    }
    const admin = await Admin.findOne({ email });
    res.status(200).json(admin);
    }catch(error){
    res.status(500).json({ message: 'Internal server error.' });
}
});

export const createEvent = asyncHandler(async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }   
    const { title, description, date, location } = req.body;    
    const event = new Event({ title, description, date, location });
    await event.save();
    res.status(201).json(event);}
    catch(error){
        res.status(500).json(error);
    }
    try {
        const subscribedUsers = await User.find({ isSubscribed: true });
        const emails = subscribedUsers.map(user => user.email).join(',');
    
        // Email notification logic
        const mailOptions = {
          from: 'your-email@gmail.com',
          to: emails, // Send to all subscribed users
          subject: 'New Event Added',
          text: `A new event has been added: ${JSON.stringify(eventDetails)}`,
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return res.status(500).send('Error sending email');
          }
          res.status(200).send('Event created and email sent to subscribers.');
        });
      } catch (error) {
        res.status(500).send('Error retrieving subscribed users.');
      }
}
);

  


export const updateEvent = asyncHandler(async (req, res) => {
    try {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    const { id } = req.params;
    const { title, description, date, location } = req.body;
    const event = await Event.findByIdAndUpdate(id, { title, description, date, location }, { new: true });
    res.status(200).json(event);
}catch(error){
    res.status(500).json({ message: 'Internal server error.' });
}
});

export const deleteEvent = asyncHandler(async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.status(200).json({ message: 'Event deleted successfully' });
}catch(error){
    res.status(500).json({ message: 'Internal server error.' });
}
});

export const getEvents =  asyncHandler(async (req, res) => {
    try {
    const events = await Event.find();
    res.status(200).json(events);
}catch(error){
    res.status(500).json({ message: 'Internal server error.' });
}
});


export const getEventById = asyncHandler(async (req, res) => {
    try {
    const { id } = req.params;
    const event = await Event.findById(id);
    res.status(200).json(event);
}catch(error){
    res.status(500).json({ message: 'Internal server error.' });
}
});



