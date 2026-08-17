import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { AdnOrder } from '@/models/AdnOrder';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const order = await AdnOrder.findById(id).lean();
    if (!order) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn xét nghiệm' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error('GET ADN order detail error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const order = await AdnOrder.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn xét nghiệm' }, { status: 404 });
    }

    // Step 2: Receive Sample ("Nhận mẫu")
    if (body.action === 'nhan_mau') {
      if (body.anhNhanMau !== undefined) order.anhNhanMau = body.anhNhanMau;
      if (body.dieuKien) order.dieuKien = body.dieuKien;
      order.trangThai = 'dang_chay_mau'; // Step 2: Đang chạy mẫu
    } else {
      if (body.dieuKien) order.dieuKien = body.dieuKien;
      if (body.loaiXetNghiemADN) order.loaiXetNghiemADN = body.loaiXetNghiemADN;
      if (body.soPhieu !== undefined) order.soPhieu = body.soPhieu;
      if (body.ngayBanHanh !== undefined) order.ngayBanHanh = body.ngayBanHanh;
      if (body.ngayYeuCau !== undefined) order.ngayYeuCau = body.ngayYeuCau;
      if (body.nguoiYeuCau !== undefined) order.nguoiYeuCau = body.nguoiYeuCau;
      if (body.nguoiThuMau !== undefined) order.nguoiThuMau = body.nguoiThuMau;
      if (body.boKit !== undefined) order.boKit = body.boKit;
      if (body.canBoXetNghiem !== undefined) order.canBoXetNghiem = body.canBoXetNghiem;
      if (body.daiDienDonVi !== undefined) order.daiDienDonVi = body.daiDienDonVi;
      if (body.kiemSoatKetQua !== undefined) order.kiemSoatKetQua = body.kiemSoatKetQua;
      if (body.anhGuiMau !== undefined) order.anhGuiMau = body.anhGuiMau;
      if (body.anhNhanMau !== undefined) order.anhNhanMau = body.anhNhanMau;
      if (body.mauDanhSach) order.mauDanhSach = body.mauDanhSach;
      if (body.table1) order.table1 = body.table1;
      if (body.table2) order.table2 = body.table2;
      if (body.table3) order.table3 = body.table3;
      if (body.ketLuan !== undefined) order.ketLuan = body.ketLuan;
      if (body.doTinCay !== undefined) order.doTinCay = body.doTinCay;
      if (body.totalLikelihoodRatio !== undefined) order.totalLikelihoodRatio = body.totalLikelihoodRatio;
      if (body.probabilityOfPaternity !== undefined) order.probabilityOfPaternity = body.probabilityOfPaternity;
      if (body.anhChayMauList) order.anhChayMauList = body.anhChayMauList;
      if (body.trangThai) order.trangThai = body.trangThai;
    }

    await order.save();
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error('PUT update ADN order error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    await AdnOrder.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Đã xóa đơn xét nghiệm thành công' });
  } catch (error: any) {
    console.error('DELETE ADN order error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
