import z from "zod";

export const signupInput = z.object({
    username: z.string().email(),
    password: z.string().min(5).max(15),
    location: z.string().nonempty(),
    firstName: z.string().nonempty(),
    lastName: z.string().nonempty(),

});

export  const signinInput = z.object({
    username: z.string().email(),
    password: z.string().min(5).max(15),
});

export  const itemToSell = z.object({
    name: z.string().nonempty(),
    description: z.string().nonempty(),
    imageLink : z.string().url(),
    quantityAvailable:  z.number(),
    minSellingQuantity : z.number(),
    pricePerUnit: z.number().positive(),
    location: z.string().nonempty()
});


export const addItemTobag = z.object({
    itemId: z.string().nonempty(),
    quantity: z.number().positive(),
})