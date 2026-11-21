# MYX category icon set: 24x24 grid, duotone inside a coloured rounded tile.
# Classes: f = soft white fill, s = white stroke, w = solid white, b = stroke in tile colour (badge).
import json, os, re, sys

GROUPS = [
 ("food", "Ăn uống", "Food & drink", "#E8772E"),
 ("transport", "Đi lại", "Transport", "#2F7FD6"),
 ("home", "Nhà & hóa đơn", "Home & bills", "#5C6B7A"),
 ("study", "Học tập", "Study", "#6D5BD0"),
 ("fun", "Giải trí", "Entertainment", "#D6336C"),
 ("sport", "Thể thao", "Sports", "#0F9D8F"),
 ("shop", "Mua sắm & làm đẹp", "Shopping & beauty", "#8B5E3C"),
 ("health", "Sức khỏe", "Health", "#E03131"),
 ("social", "Xã hội & quan hệ", "Social & people", "#A61E4D"),
 ("income", "Thu nhập", "Income", "#2B8A3E"),
 ("subs", "Gói đăng ký", "Subscriptions", "#3B5BDB"),
 ("misc", "Khác", "Other", "#6B7378"),
]

BADGE = '<circle cx="18.5" cy="18.5" r="5" fill="#fff"/><path class="b" d="M21 17.6a2.7 2.7 0 0 0-5-.7M16 19.4a2.7 2.7 0 0 0 5 .7M15.9 15.5v1.7h1.7M21.1 21.5v-1.7h-1.7"/>'
GAME = '<path class="f" d="M7 7h10a5 5 0 0 1 4.6 7l-1 2.3a2.5 2.5 0 0 1-4.3.5L14.5 15h-5l-1.8 1.8a2.5 2.5 0 0 1-4.3-.5l-1-2.3A5 5 0 0 1 7 7z"/><path class="s" d="M7 7h10a5 5 0 0 1 4.6 7l-1 2.3a2.5 2.5 0 0 1-4.3.5L14.5 15h-5l-1.8 1.8a2.5 2.5 0 0 1-4.3-.5l-1-2.3A5 5 0 0 1 7 7zM7.5 10v3M6 11.5h3M15.5 10.5h.01M17.5 12.5h.01"/>'

I = [
 # food
 ("rice","food","Cơm","Rice meal",'<path class="f" d="M4 11h16a8 8 0 0 1-16 0z"/><path class="s" d="M4 11h16a8 8 0 0 1-16 0zM9 20h6M7.5 11a4.5 3 0 0 1 9 0M14 3l-3 7M18 4l-4 6"/>'),
 ("noodle","food","Phở, bún","Noodle soup",'<path class="f" d="M3 12h18a9 7 0 0 1-18 0z"/><path class="s" d="M3 12h18a9 7 0 0 1-18 0zM9 20h6M8 9c0-1.5 1.5-1.5 1.5-3S8 4.5 8 3M12 9c0-1.5 1.5-1.5 1.5-3S12 4.5 12 3M16 9c0-1.5 1.5-1.5 1.5-3S16 4.5 16 3"/>'),
 ("banhmi","food","Bánh mì","Bread",'<path class="f" d="M5 18c-2-2 0-6 4-10s8-6 10-4 0 6-4 10-8 6-10 4z"/><path class="s" d="M5 18c-2-2 0-6 4-10s8-6 10-4 0 6-4 10-8 6-10 4zM9 11l2 2M12 8l2 2M6.5 14l2 2"/>'),
 ("coffee","food","Cà phê","Coffee",'<path class="f" d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path class="s" d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M4 21.5h14M8.5 3c0 1.5 1 1.5 1 3M12.5 3c0 1.5 1 1.5 1 3"/>'),
 ("milktea","food","Trà sữa","Milk tea",'<path class="f" d="M6 9h12l-1.5 11a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1z"/><path class="s" d="M6 9h12l-1.5 11a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1zM5 9h14M13 9l2-6.5 3 .8"/><circle class="w" cx="10" cy="17.5" r="1.1"/><circle class="w" cx="13.4" cy="18.2" r="1.1"/><circle class="w" cx="12" cy="15" r="1.1"/>'),
 ("soda","food","Nước ngọt","Soft drink",'<rect class="f" x="7" y="4" width="10" height="17" rx="2.5"/><rect class="s" x="7" y="4" width="10" height="17" rx="2.5"/><path class="s" d="M10 2.2h4M7 9h10M7 16h10"/>'),
 ("candy","food","Bánh kẹo","Snacks & sweets",'<circle class="f" cx="12" cy="12" r="4.5"/><circle class="s" cx="12" cy="12" r="4.5"/><path class="s" d="M7.8 10.3L3 8v8l4.8-2.3M16.2 10.3L21 8v8l-4.8-2.3M10.5 10.5l3 3"/>'),
 ("icecream","food","Kem","Ice cream",'<path class="f" d="M7 10a5 5 0 0 1 10 0z"/><path class="s" d="M7 10h10l-5 11zM7 10a5 5 0 0 1 10 0M9.5 13l4 3M14.5 13l-3.2 4.2"/>'),
 ("fruit","food","Trái cây","Fruit",'<path class="f" d="M12 8c-2-1.5-6-1-6 4 0 4 3 9 6 7.5 3 1.5 6-3.5 6-7.5 0-5-4-5.5-6-4z"/><path class="s" d="M12 8c-2-1.5-6-1-6 4 0 4 3 9 6 7.5 3 1.5 6-3.5 6-7.5 0-5-4-5.5-6-4zM12 8V4M12 5c1-2 3-2.2 4-1.5-1 1.5-3 2-4 1.5"/>'),
 ("market","food","Đi chợ, siêu thị","Groceries",'<path class="f" d="M3 10h18l-2 9a2 2 0 0 1-2 1.6H7A2 2 0 0 1 5 19z"/><path class="s" d="M3 10h18l-2 9a2 2 0 0 1-2 1.6H7A2 2 0 0 1 5 19zM8 10l3-6M16 10l-3-6M9 14v3M12 14v3M15 14v3"/>'),
 ("beer","food","Bia, nhậu","Drinks out",'<path class="f" d="M5 8h10v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path class="s" d="M5 8h10v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM15 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M5 8a2.5 2.5 0 0 1 2-4 3 3 0 0 1 5 0 2.5 2.5 0 0 1 3 4M8.5 12v5M11.5 12v5"/>'),
 # transport
 ("fuel","transport","Xăng","Fuel",'<rect class="f" x="4" y="3" width="10" height="18" rx="2"/><path class="s" d="M6 3h6a2 2 0 0 1 2 2v16H4V5a2 2 0 0 1 2-2zM3 21h12M7 7h4v4H7zM14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V9l-3-3"/>'),
 ("bike","transport","Xe ôm, xe máy","Motorbike ride",'<circle class="f" cx="6" cy="16" r="3.5"/><circle class="f" cx="18" cy="16" r="3.5"/><circle class="s" cx="6" cy="16" r="3.5"/><circle class="s" cx="18" cy="16" r="3.5"/><path class="s" d="M6 16h5l3-6h-4M14 10l4 6M15 6h3l-1 4"/>'),
 ("bus","transport","Xe buýt","Bus",'<rect class="f" x="4" y="3" width="16" height="15" rx="3"/><rect class="s" x="4" y="3" width="16" height="15" rx="3"/><path class="s" d="M4 11h16M8 21v-3M16 21v-3M8 14.5h.01M16 14.5h.01M8 6.5h8"/>'),
 ("car","transport","Taxi, ô tô","Taxi & car",'<path class="f" d="M3 13l2-5a2 2 0 0 1 2-1.5h10A2 2 0 0 1 19 8l2 5v4H3z"/><path class="s" d="M3 13l2-5a2 2 0 0 1 2-1.5h10A2 2 0 0 1 19 8l2 5v4H3zM3 13h18M10 6.5V4h4v2.5M6 17v2.5M18 17v2.5M7 15h.01M17 15h.01"/>'),
 ("parking","transport","Gửi xe","Parking",'<rect class="f" x="4" y="4" width="16" height="16" rx="4"/><rect class="s" x="4" y="4" width="16" height="16" rx="4"/><path class="s" d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3"/>'),
 ("ticket","transport","Vé tàu, xe, máy bay","Travel tickets",'<path class="f" d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path class="s" d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zM15 6v2M15 11v2M15 16v2M7 10h4M7 14h3"/>'),
 ("repair","transport","Sửa xe","Vehicle repair",'<path class="f" d="M14.5 3.5a5 5 0 0 0-5.2 6.8L3.5 16.1a2.1 2.1 0 0 0 3 3l5.8-5.8a5 5 0 0 0 6.8-5.2l-3 3-3-.8-.8-3z"/><path class="s" d="M14.5 3.5a5 5 0 0 0-5.2 6.8L3.5 16.1a2.1 2.1 0 0 0 3 3l5.8-5.8a5 5 0 0 0 6.8-5.2l-3 3-3-.8-.8-3z"/>'),
 # home
 ("rent","home","Tiền phòng","Rent",'<path class="f" d="M5 10.5l7-6.2 7 6.2V20H5z"/><path class="s" d="M3 12l9-8 9 8M5 10.5V20h14v-9.5M10 20v-5h4v5"/>'),
 ("power","home","Điện","Electricity",'<path class="f" d="M13 2L5 13h6l-1 9 8-11h-6z"/><path class="s" d="M13 2L5 13h6l-1 9 8-11h-6z"/>'),
 ("water","home","Nước","Water",'<path class="f" d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path class="s" d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11zM9 14a3 3 0 0 0 3 3"/>'),
 ("wifi","home","Wifi, internet","Internet",'<path class="f" d="M3 9a13 13 0 0 1 18 0l-9 9z"/><circle class="w" cx="12" cy="18.5" r="1.6"/><path class="s" d="M3 9a13 13 0 0 1 18 0M6 12.5a8.5 8.5 0 0 1 12 0M9 15.8a4 4 0 0 1 6 0"/>'),
 ("topup","home","Nạp điện thoại","Phone top-up",'<rect class="f" x="6" y="2.5" width="12" height="19" rx="2.5"/><rect class="s" x="6" y="2.5" width="12" height="19" rx="2.5"/><path class="s" d="M10.5 18.5h3M12.8 6.5l-2.3 4h3l-2.3 4"/>'),
 ("gas","home","Gas","Cooking gas",'<path class="f" d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-1.5-2-1.5-3C7 10 6 12.5 6 15a6 6 0 0 0 6 6z"/><path class="s" d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-1.5-2-1.5-3C7 10 6 12.5 6 15a6 6 0 0 0 6 6zM12 21a2.5 2.5 0 0 1-2.5-2.5c0-1.5 2.5-4 2.5-4s2.5 2.5 2.5 4A2.5 2.5 0 0 1 12 21z"/>'),
 # study
 ("tuition","study","Học phí","Tuition",'<path class="f" d="M2 9l10-5 10 5-10 5z"/><path class="s" d="M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v5"/>'),
 ("book","study","Sách","Books",'<path class="f" d="M3 5c3-1 6-1 9 1v14c-3-2-6-2-9-1z"/><path class="s" d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1zM12 6v14"/>'),
 ("print","study","Photo, in ấn","Printing",'<rect class="f" x="3" y="8" width="18" height="9" rx="2"/><path class="s" d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7zM17.5 11h.01"/>'),
 ("course","study","Khóa học online","Online course",'<rect class="f" x="4" y="4" width="16" height="11" rx="1.5"/><rect class="s" x="4" y="4" width="16" height="11" rx="1.5"/><path class="s" d="M2 19h20M10.5 7.5l4 2-4 2z"/>'),
 # fun
 ("music","fun","Nghe nhạc","Music",'<circle class="f" cx="7" cy="17" r="3"/><circle class="f" cx="17" cy="15" r="3"/><path class="s" d="M10 17V5l10-2v12M10 9l10-2"/><circle class="s" cx="7" cy="17" r="3"/><circle class="s" cx="17" cy="15" r="3"/>'),
 ("movie","fun","Xem phim","Movies",'<rect class="f" x="3" y="9" width="18" height="12" rx="2"/><rect class="s" x="3" y="9" width="18" height="12" rx="2"/><path class="s" d="M3 9l16.5-5 1 3.2M7.5 7.6l2.4 2.2M12.5 6.1l2.4 2.2M10.5 12.5l4.5 2.5-4.5 2.5z"/>'),
 ("game","fun","Game","Games",GAME),
 ("concert","fun","Concert, sự kiện","Concerts & events",'<rect class="f" x="9" y="2.5" width="6" height="11" rx="3"/><rect class="s" x="9" y="2.5" width="6" height="11" rx="3"/><path class="s" d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>'),
 ("travel","fun","Du lịch","Travel",'<rect class="f" x="3" y="7" width="18" height="13" rx="2.5"/><rect class="s" x="3" y="7" width="18" height="13" rx="2.5"/><path class="s" d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M8 7v13M16 7v13"/>'),
 ("photo","fun","Chụp ảnh","Photography",'<path class="f" d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path class="s" d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle class="s" cx="12" cy="13" r="3.5"/>'),
 # sport
 ("badminton","sport","Cầu lông","Badminton",'<path class="f" d="M7.5 3h9l-2.6 12h-3.8z"/><path class="s" d="M7.5 3h9l-2.6 12h-3.8zM10.6 3l.5 12M13.4 3l-.5 12M8.3 7.5h7.4"/><path class="w" d="M10 15h4v2a2 2 0 0 1-4 0z"/>'),
 ("volleyball","sport","Bóng chuyền","Volleyball",'<circle class="f" cx="12" cy="12" r="9"/><circle class="s" cx="12" cy="12" r="9"/><path class="s" d="M12 3c-1.5 4-.5 7.5 2.5 10M21 12.5c-4-1.8-7.5-1.2-9.5 1.5M5 18.5c3.2-.8 5.6-2.6 6.5-4.5M11.5 14C8 13 5.5 10.6 4.2 7.5"/>'),
 ("football","sport","Bóng đá","Football",'<circle class="f" cx="12" cy="12" r="9"/><path class="w" d="M12 8l3.3 2.4-1.3 3.9h-4l-1.3-3.9z"/><circle class="s" cx="12" cy="12" r="9"/><path class="s" d="M12 8V3.5M15.3 10.4l4.3-1.5M14 14.3l2.7 3.7M10 14.3L7.3 18M8.7 10.4L4.4 8.9"/>'),
 ("gym","sport","Gym","Gym",'<rect class="f" x="3" y="7.5" width="4" height="9" rx="1"/><rect class="f" x="17" y="7.5" width="4" height="9" rx="1"/><rect class="s" x="3" y="7.5" width="4" height="9" rx="1"/><rect class="s" x="17" y="7.5" width="4" height="9" rx="1"/><path class="s" d="M7 12h10M1.6 10.5v3M22.4 10.5v3"/>'),
 ("swim","sport","Bơi","Swimming",'<path class="f" d="M3 16c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0V20H3z"/><circle class="w" cx="16.5" cy="6.5" r="2"/><path class="s" d="M4 12l5-3.5 3.2 3.2 2.3-1.2M3 16c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0M3 20c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0"/>'),
 ("run","sport","Chạy bộ","Running",'<path class="f" d="M3 17V9.5l4-1 2 2.5 3-1 3 3 5 1a2 2 0 0 1 2 2V17z"/><path class="s" d="M3 17V9.5l4-1 2 2.5 3-1 3 3 5 1a2 2 0 0 1 2 2V17zM3 17v2.5h18V17M10 13.5l1-1M12.5 15l1-1"/>'),
 # shop
 ("clothes","shop","Quần áo","Clothes",'<path class="f" d="M8 3L3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z"/><path class="s" d="M8 3L3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z"/>'),
 ("cosmetic","shop","Mỹ phẩm","Cosmetics",'<path class="f" d="M8 11h8v10H8z"/><path class="s" d="M8 11h8v10H8zM9.5 11V7l5-3v7M8 15h8"/>'),
 ("beauty","shop","Làm đẹp, cắt tóc","Hair & beauty",'<circle class="f" cx="6" cy="18" r="3"/><circle class="f" cx="18" cy="18" r="3"/><circle class="s" cx="6" cy="18" r="3"/><circle class="s" cx="18" cy="18" r="3"/><path class="s" d="M8 15.8L17 3M16 15.8L7 3"/>'),
 ("gadget","shop","Đồ điện tử","Electronics",'<rect class="f" x="3" y="14" width="5" height="7" rx="2"/><rect class="f" x="16" y="14" width="5" height="7" rx="2"/><path class="s" d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect class="s" x="3" y="14" width="5" height="7" rx="2"/><rect class="s" x="16" y="14" width="5" height="7" rx="2"/>'),
 ("parcel","shop","Đơn hàng online","Online orders",'<path class="f" d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path class="s" d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9M7.5 5.2l9 4.5"/>'),
 # health
 ("medicine","health","Thuốc","Medicine",'<path class="f" d="M4.5 13.5l9-9a4.2 4.2 0 0 1 6 6l-9 9a4.2 4.2 0 0 1-6-6z"/><path class="w" d="M4.5 13.5L9 9l6 6-4.5 4.5a4.2 4.2 0 0 1-6-6z"/><path class="s" d="M4.5 13.5l9-9a4.2 4.2 0 0 1 6 6l-9 9a4.2 4.2 0 0 1-6-6zM9 9l6 6"/>'),
 ("doctor","health","Khám bệnh","Doctor visit",'<path class="f" d="M12 20s-8-4.5-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.5 12 20 12 20z"/><path class="s" d="M12 20s-8-4.5-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.5 12 20 12 20zM6.5 12h3l1.5-3 2.5 6 1.5-3h2.5"/>'),
 # social
 ("gift","social","Quà tặng","Gifts",'<rect class="f" x="3" y="9" width="18" height="12" rx="1.5"/><path class="s" d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6-.5 6-1.5S14 5 12 9"/>'),
 ("wedding","social","Đám cưới, tiền mừng","Weddings & gifts of money",'<rect class="f" x="3" y="6" width="18" height="13" rx="2"/><rect class="s" x="3" y="6" width="18" height="13" rx="2"/><path class="s" d="M3 8l9 6 9-6"/><path class="w" d="M12 18.4s-2.8-1.6-2.8-3.5a1.4 1.4 0 0 1 2.8-.4 1.4 1.4 0 0 1 2.8.4c0 1.9-2.8 3.5-2.8 3.5z"/>'),
 ("charity","social","Từ thiện","Donations",'<path class="f" d="M12 11s-4-2.4-4-5a2 2 0 0 1 4-1 2 2 0 0 1 4 1c0 2.6-4 5-4 5z"/><path class="s" d="M12 11s-4-2.4-4-5a2 2 0 0 1 4-1 2 2 0 0 1 4 1c0 2.6-4 5-4 5zM3 14h3l3 1.5h4a1.5 1.5 0 0 1 0 3H9M6 20.5l3 .8 7.5-2 4-4a1.5 1.5 0 0 0-2-2.2l-4 3"/>'),
 ("lend","social","Cho mượn, vay bạn","Lend & borrow",'<circle class="f" cx="12" cy="12" r="9"/><circle class="s" cx="12" cy="12" r="9"/><path class="s" d="M7 9.5h10l-3-3M17 14.5H7l3 3"/>'),
 ("date","social","Hẹn hò, người yêu","Dating & partner",'<path class="f" d="M10 20s-7-4-7-9a4 4 0 0 1 7-2.5A4 4 0 0 1 17 11c0 5-7 9-7 9z"/><path class="s" d="M10 20s-7-4-7-9a4 4 0 0 1 7-2.5A4 4 0 0 1 17 11c0 5-7 9-7 9zM15.5 7.2A3 3 0 0 1 21 9c0 1.6-1 3-2.2 4.2"/>'),
 ("pet","social","Thú cưng","Pets",'<path class="f" d="M12 11.5c-3 0-6 3.5-6 6a2.5 2.5 0 0 0 3 2.3c1-.3 2-.6 3-.6s2 .3 3 .6a2.5 2.5 0 0 0 3-2.3c0-2.5-3-6-6-6z"/><path class="s" d="M12 11.5c-3 0-6 3.5-6 6a2.5 2.5 0 0 0 3 2.3c1-.3 2-.6 3-.6s2 .3 3 .6a2.5 2.5 0 0 0 3-2.3c0-2.5-3-6-6-6z"/><ellipse class="w" cx="4.8" cy="10" rx="1.8" ry="2.3"/><ellipse class="w" cx="9" cy="5.6" rx="1.8" ry="2.3"/><ellipse class="w" cx="15" cy="5.6" rx="1.8" ry="2.3"/><ellipse class="w" cx="19.2" cy="10" rx="1.8" ry="2.3"/>'),
 # income
 ("salary","income","Lương","Salary",'<rect class="f" x="2.5" y="6" width="19" height="12" rx="2"/><rect class="s" x="2.5" y="6" width="19" height="12" rx="2"/><circle class="s" cx="12" cy="12" r="2.8"/><path class="s" d="M6 9.5v5M18 9.5v5"/>'),
 ("parttime","income","Làm thêm","Part-time job",'<rect class="f" x="3" y="7" width="18" height="13" rx="2.5"/><rect class="s" x="3" y="7" width="18" height="13" rx="2.5"/><path class="s" d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18M11 12.5h2v2h-2z"/>'),
 ("scholar","income","Học bổng","Scholarship",'<circle class="f" cx="12" cy="9" r="6"/><circle class="s" cx="12" cy="9" r="6"/><path class="s" d="M8.5 13.8L7 21l5-2.5 5 2.5-1.5-7.2"/><path class="w" d="M12 5.8l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z"/>'),
 ("family","income","Gia đình cho","From family",'<path class="f" d="M2.5 20a5.5 5.5 0 0 1 11 0z"/><circle class="f" cx="8" cy="7.5" r="3"/><circle class="s" cx="8" cy="7.5" r="3"/><circle class="s" cx="17" cy="9.5" r="2.3"/><path class="s" d="M2.5 20a5.5 5.5 0 0 1 11 0M14 20a3.8 3.8 0 0 1 7.5 0"/>'),
 ("bonus","income","Thưởng","Bonus",'<path class="f" d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4l-5.3 3 1.2-6-4.5-4.1 6-.7z"/><path class="s" d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4l-5.3 3 1.2-6-4.5-4.1 6-.7z"/>'),
 # subscriptions
 ("sub_ai","subs","Gói AI","AI plan",'<path class="f" d="M11 3c.8 4.2 2.8 6.2 7 7-4.2.8-6.2 2.8-7 7-.8-4.2-2.8-6.2-7-7 4.2-.8 6.2-2.8 7-7z"/><path class="s" d="M11 3c.8 4.2 2.8 6.2 7 7-4.2.8-6.2 2.8-7 7-.8-4.2-2.8-6.2-7-7 4.2-.8 6.2-2.8 7-7z"/>'+BADGE),
 ("sub_music","subs","Gói nhạc","Music plan",'<circle class="f" cx="6" cy="15" r="2.6"/><circle class="f" cx="14.5" cy="13" r="2.6"/><path class="s" d="M8.6 15V5l8.5-2v10"/><circle class="s" cx="6" cy="15" r="2.6"/><circle class="s" cx="14.5" cy="13" r="2.6"/>'+BADGE),
 ("sub_video","subs","Gói phim, video","Video plan",'<rect class="f" x="2.5" y="4.5" width="16" height="12" rx="3"/><rect class="s" x="2.5" y="4.5" width="16" height="12" rx="3"/><path class="s" d="M8.8 8l4.5 2.5-4.5 2.5z"/>'+BADGE),
 ("sub_cloud","subs","Lưu trữ cloud","Cloud storage",'<path class="f" d="M6.5 16a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 16.5 7a4.5 4.5 0 0 1 .5 9z"/><path class="s" d="M6.5 16a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 16.5 7a4.5 4.5 0 0 1 .5 9z"/>'+BADGE),
 ("sub_game","subs","Gói game","Game pass",'<g transform="translate(-1.5 -2) scale(.9)">'+GAME+'</g>'+BADGE),
 ("sub_app","subs","Ứng dụng khác","Other app",'<rect class="f" x="3" y="3" width="7" height="7" rx="2"/><rect class="f" x="12.5" y="3" width="7" height="7" rx="2"/><rect class="f" x="3" y="12.5" width="7" height="7" rx="2"/><rect class="s" x="3" y="3" width="7" height="7" rx="2"/><rect class="s" x="12.5" y="3" width="7" height="7" rx="2"/><rect class="s" x="3" y="12.5" width="7" height="7" rx="2"/>'+BADGE),
 ("other","misc","Khác","Other",'<circle class="w" cx="6" cy="12" r="2"/><circle class="w" cx="12" cy="12" r="2"/><circle class="w" cx="18" cy="12" r="2"/>'),
]

# Phosphor Icons (MIT, https://github.com/phosphor-icons/core) duotone glyphs used per icon id.
# Ids not listed here keep the hand-drawn MYX glyph above.
PH = {
 "rice":"bowl-food","noodle":"bowl-steam","banhmi":"bread","coffee":"coffee","candy":"cookie",
 "icecream":"ice-cream","fruit":"orange","market":"basket","beer":"beer-stein",
 "fuel":"gas-pump","bike":"motorcycle","bus":"bus","car":"taxi","parking":"letter-circle-p",
 "ticket":"ticket","repair":"wrench",
 "rent":"house","power":"lightning","water":"drop","wifi":"globe","topup":"device-mobile","gas":"flame",
 "tuition":"graduation-cap","book":"book-open","print":"printer","course":"monitor-play",
 "music":"music-notes","movie":"film-slate","game":"game-controller","concert":"microphone-stage",
 "travel":"suitcase-rolling","photo":"camera",
 "volleyball":"volleyball","football":"soccer-ball","gym":"barbell","swim":"swimming-pool","run":"sneaker-move",
 "clothes":"t-shirt","beauty":"scissors","gadget":"headphones","parcel":"package",
 "medicine":"pill","doctor":"heartbeat",
 "gift":"gift","charity":"hand-heart","lend":"hand-coins","date":"heart","pet":"paw-print",
 "salary":"money","parttime":"briefcase","scholar":"medal","family":"users","bonus":"star",
 "sub_ai":"sparkle","sub_music":"music-note","sub_video":"video","sub_cloud":"cloud",
 "sub_game":"game-controller","sub_app":"squares-four","other":"dots-three",
}

def ph_glyph(name, root, scale=0.09375, offset=0):
    svg = open(os.path.join(root, name + "-duotone.svg")).read()
    out = []
    for m in re.finditer(r'<path d="([^"]+)"( opacity="0.2")?/>', svg):
        out.append('<path class="%s" d="%s"/>' % ("f" if m.group(2) else "w", m.group(1)))
    assert out, name
    return '<g transform="translate(%s %s) scale(%s)">%s</g>' % (offset, offset, scale, "".join(out))

def data(root=None):
    return {
        "groups":[{"id":g,"vi":v,"en":e,"c":c} for g,v,e,c in GROUPS],
        "icons":[{"id":i,"g":g,"vi":v,"en":e,"src":"phosphor" if root and i in PH else "myx",
                  "svg":(ph_glyph(PH[i],root,0.08,0)+BADGE if i.startswith("sub_") else ph_glyph(PH[i],root)) if root and i in PH else s}
                 for i,g,v,e,s in I],
    }

if __name__ == "__main__":
    root = sys.argv[1] if len(sys.argv) > 1 else None  # path to @phosphor-icons/core/assets/duotone
    d=data(root); ids=[x["id"] for x in d["icons"]]
    assert len(ids)==len(set(ids))
    print(len(ids),"icons,",sum(x["src"]=="phosphor" for x in d["icons"]),"from Phosphor")
    open(__import__("os").path.join(__import__("os").path.dirname(__file__),"icons.json"),"w").write(json.dumps(d,ensure_ascii=False))
