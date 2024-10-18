from pyteal import *

"""Storage boxes demo"""

def approval_program():
    handle_creation = Return(Int(1))
    handle_optin = Return(Int(0))
    handle_closeout = Return(Int(0))
    handle_updateapp = Return(Int(0))
    handle_deleteapp = Return(Int(1))

    '''
    Creates a box with a name and specified space.
    
    Box name - 1-64 bytes
    Box size - 0-32 KB
    '''
    create_box = Seq(
        Assert(App.box_create(Txn.application_args[1], Btoi(Txn.application_args[2]))),
        Return(Int(1))
    )
    '''
    Put data into the box

    Size of data array is different from original box size => error
    '''
    box_put = Seq(
        App.box_put(Txn.application_args[1], Txn.application_args[2]),
        Return(Int(1))
    )

    '''
    Replaces the data in the box from the start position of the stored byte value

    Size of the replacement data when added to the start position exceeds upper bound of box => error
    '''
    box_replace = Seq(
        boxval := App.box_get(Txn.application_args[1]),
        Assert(boxval.hasValue()),
        App.box_replace(Txn.application_args[1], Btoi(Txn.application_args[2]), Txn.application_args[3]),
        Return(Int(1))
    )

    '''
    Reads data from the box

    Check value exists before using it
    AVM is limited to reading no more than 4kb at a time
    '''
    box_read = Seq(
        boxval := App.box_get(Txn.application_args[1]),
        Assert(boxval.hasValue()),
        App.globalPut(Bytes("output"), boxval.value()),
        Return(Int(1))
    )

    '''
    Extracts data from the box

    Use this to read parts of the data if it is more than 4kb
    '''
    box_extract = Seq(
        boxval := App.box_get(Txn.application_args[1]),
        Assert(boxval.hasValue()),
        App.globalPut(Bytes("extracted"), App.box_extract(Txn.application_args[1], Btoi(Txn.application_args[2]), Btoi(Txn.application_args[3]))),
        Return(Int(1))
    )

    '''
    Gets the length of the box

    Returns the length of the box or 0 if it doesn't exist
    '''
    box_length = Seq(
        boxlength := App.box_length(Txn.application_args[1]),
        Assert(boxlength.hasValue()),
        App.globalPut(Bytes("box length"), boxlength.value()),
        Return(Int(1))
    )

    '''
    Deletes the box

    Returns the length of the box or 0 if it doesn't exist
    '''
    box_delete = Seq(
        Assert(App.box_delete(Txn.application_args[1])),
        Return(Int(1))
    )

    handle_noop = Cond(
        [Txn.application_args[0] == Bytes("create_box"), create_box], 
        [Txn.application_args[0] == Bytes("box_put"), box_put],
        [Txn.application_args[0] == Bytes("box_replace"), box_replace],
        [Txn.application_args[0] == Bytes("box_read"), box_read],
        [Txn.application_args[0] == Bytes("box_extract"), box_extract],
        [Txn.application_args[0] == Bytes("box_length"), box_length],
        [Txn.application_args[0] == Bytes("box_delete"), box_delete]
    )


    program = Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, handle_closeout],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_updateapp],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deleteapp],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop]
    )

    return compileTeal(program, Mode.Application, version=8)

# print out the results
print(approval_program())