// const User = require('../models/User');
// const Researcher = require('../models/Researcher');

// //* Create a user and a linked researcher record
// exports.createResearcher = async (req, res, next) => {
//     const session = await User.startSession();
//     session.startTransaction();

//     try {
//         const {
//             firstName,
//             lastName,
//             username,
//             email,
//             phoneNumber,
//             password,
//             pin1,
//             pin2,
//             role,
//             teams,
//             projects,
//             contactDetails,
//         } = req.body;

//         //* Step 1: Create the user record
//         const user = await User.create([{
//             firstName,
//             lastName,
//             username,
//             email,
//             phoneNumber,
//             password, // Ensure password is hashed before saving
//             pin1,
//             pin2,
//         }], { session });

//         //* Step 2: Create the researcher record linked to the user
//         const researcher = await Researcher.create([{
//             userId: user[0]._id,
//             role,
//             teams,
//             projects,
//             contactDetails,
//         }], { session });

//         await session.commitTransaction();
//         session.endSession();

//         res.status(201).json({
//             success: true,
//             message: 'User and researcher created successfully',
//             user: {
//                 id: user[0]._id,
//                 firstName: user[0].firstName,
//                 lastName: user[0].lastName,
//                 email: user[0].email,
//             },
//             researcher: {
//                 id: researcher[0]._id,
//                 role: researcher[0].role,
//                 teams: researcher[0].teams,
//                 projects: researcher[0].projects,
//             },
//         });
//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         next(error); //* Pass error to error-handling middleware
//     }
// };
