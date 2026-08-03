// Biến đổi vi sinh options
export const BIEN_DOI_VI_SINH_OPTIONS = [
  { value: 'trichomonas', label: 'Trichomonas vaginalis' },
  { value: 'candida', label: 'Candida spp' },
  { value: 'tapKhuan', label: 'Tạp khuẩn' },
  { value: 'actinomyces', label: 'Actinomyces spp' },
  { value: 'gardnerella', label: 'Gardnerella vaginalis' },
  { value: 'hpv', label: 'HPV' },
];

// Biến đổi tế bào khác options
export const BIEN_DOI_KHAC_OPTIONS = [
  { value: 'viem', label: 'Tế bào biến đổi do viêm' },
  { value: 'xaTri', label: 'Tế bào biến đổi do xạ trị' },
  { value: 'iud', label: 'Tế bào biến đổi do vòng tránh thai (IUD)' },
  { value: 'teo', label: 'Tế bào biểu mô teo' },
];

// Bất thường tế bào vảy options
export const BAT_THUONG_VAY_OPTIONS = [
  { value: 'ascUs', label: 'Tế bào vảy không điển hình ý nghĩa không xác định (ASC-US)' },
  { value: 'ascH', label: 'Tế bào vảy không điển hình, chưa loại trừ HSIL (ASC-H)' },
  { value: 'lsil', label: 'Tổn thương trong biểu mô vảy grade thấp (LSIL)' },
  { value: 'lsilHpv', label: 'Tổn thương trong biểu mô vảy grade thấp (LSIL) + HPV' },
  { value: 'hsil', label: 'Tổn thương trong biểu mô vảy grade cao (HSIL)' },
  { value: 'carcinomaVay', label: 'Carcinoma tế bào vảy' },
];

// Bất thường tế bào tuyến options
export const BAT_THUONG_TUYEN_OPTIONS = [
  { value: 'agc', label: 'Tế bào tuyến không điển hình (AGC)' },
  { value: 'agcKdh', label: 'AGC, loại không đặc hiệu' },
  { value: 'agcKCtc', label: 'AGC, hướng về K tuyến CTC' },
  { value: 'agcKTuyen', label: 'AGC, hướng về K tuyến' },
  { value: 'carcinomaTaiCho', label: 'Carcinoma tuyến tại chỗ' },
  { value: 'carcinomaCtc', label: 'Carcinoma tuyến cổ trong CTC' },
  { value: 'carcinomaNoiMac', label: 'Carcinoma tuyến nội mạc tử cung' },
  { value: 'carcinomaKdh', label: 'Carcinoma tuyến, loại không đặc hiệu' },
];
