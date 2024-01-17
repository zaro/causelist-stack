// join opts in the user
db.createView("user_with_unused_otp", "users", [
  {
    $lookup: {
      from: "otps",
      localField: "phone",
      foreignField: "phone",
      as: "otp",
    },
  },
  {
    $project: {
      phone: 1,
      email: 1,
      firstName: 1,
      lastName: 1,
      otpUsed: "$otp.used",
    },
  },
  { $unwind: "$otpUsed" },
]);
// export as CSV
// mongoexport -u causelist -p causelist -d causelist -c user_with_unused_otp --type=csv -f phone,email,firstName,lastName,otpUsed
