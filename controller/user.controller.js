import User from '../model/user.model.js'; 
export const createUser = async (req, res) => {
    try {
        const {name, email, mobile, registrationNumber, branch, semester} = req.body
        const user = req.user
        user.name = name
        user.email = email
        user.mobile = mobile
        user.registrationNumber = registrationNumber
        user.branch = branch
        user.semester = semester
        await user.save()
        res.status(200).json(user)
    } catch (error) {
        res.status(400).send(error);
    }
};

export const loginUser = async (req, res) => {
    try {
        const { registrationNumber , password } = req.body;
        const user = await User.findOne({ registrationNumber }); 
        if (!user) {
            return res.status(401).json({ message: 'Invalid registration number or password' });
        }
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid registration number or password' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send(error);
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        res.status(200).send(user);
    } catch (error) {
        res.status(500).send(error);
    }
};


export const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body);
        if (!user) {
            return res.status(404).send();
        }
        res.status(200).send(user);
    } catch (error) {
        res.status(400).send(error);
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        res.status(200).send(user);
    } catch (error) {
        res.status(500).send(error);
    }
};
