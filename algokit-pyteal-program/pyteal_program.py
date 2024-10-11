from pyteal import *

ASSET_CREATOR = Addr("YGNXZR6PXQXSJXCFE6JIUQQBZQ6MC6HEJTZJCZLS3JZCU7ZB5KS7PFWBJY")
ASSET_RECEIVER = Addr("Y6U4RBW7HFFGUW6U2HX2HARXFD2VZ4L43XVNI5RJ2QWHK5MGZNTLINXLFE")


def pyteal_program():
    return Seq(
        Assert(Global.group_size() == Int(3)),
        # Asset opt in
        Assert(Gtxn[0].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[0].asset_amount() == Int(0)),
        Assert(Gtxn[0].sender() == ASSET_RECEIVER),
        Assert(Gtxn[0].asset_receiver() == ASSET_RECEIVER),
        # Payment of 5 Algos
        Assert(Gtxn[1].type_enum() == TxnType.Payment),
        Assert(Gtxn[1].amount() == Int(5_000_000)),
        Assert(Gtxn[1].sender() == ASSET_RECEIVER),
        Assert(Gtxn[1].receiver() == ASSET_CREATOR),
        # Asset transfer
        Assert(Gtxn[2].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[2].asset_amount() == Int(1)),
        Assert(Gtxn[2].sender() == ASSET_CREATOR),
        Assert(Gtxn[2].asset_receiver() == ASSET_RECEIVER),
        # Approve if all assertions pass
        Approve(),
    )


if __name__ == "__main__":
    stateless_sc = compileTeal(pyteal_program(), mode=Mode.Signature, version=6)
    with open("./artifacts/pyteal_program.teal", "w") as f:
        f.write(stateless_sc)
