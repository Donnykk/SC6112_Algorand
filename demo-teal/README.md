# Sample TEAL program
Sample TEAL program which demostrates the following operations,

1. Branching
2. Subroutines
3. Transaction Properties
4. Argument passing

3 accounts are required for this demo. The main script tries to submit transactions signed by the logic sigature generated from the TEAL program. The transactions are checked against the logic of the program before actual submission.

## Setup instructions

### Install packages
```
yarn install
```

### Update environement variables
1. Copy `.env.example` to `.env`.
2. Update Algorand Sandbox credentials in `.env` file.
3. Run `source .env` in the project directory

### Replace receiver address
In the `main.teal`, replace receiver's address with the `acc2`'s address in the `.env` file.

### Run demo
```
node scripts/main.js
```


