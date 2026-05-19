# Fill & Chọn Vùng

Bảng hỗ trợ chọn nhiều cell, kéo fill handle, và dán từ bảng tính.

---

## Fill handle

Mỗi cell hiện một handle nhỏ ở góc dưới bên phải. Kéo nó để điền các dòng kề với cùng giá trị — hoặc chuỗi tự động phát hiện.

### Cách dùng

1. Click cell để focus
2. Di chuột vào góc dưới bên phải — con trỏ đổi thành dấu thập
3. Kéo xuống (hoặc lên) để điền các dòng

### Phát hiện chuỗi

| Giá trị nguồn | Hành vi fill |
|--------------|-------------|
| Một giá trị (bất kỳ kiểu) | Copy — cùng giá trị cho tất cả cell được fill |
| Hai số trở lên có delta cố định | Chuỗi số — tăng theo delta |
| Hai ngày ISO (`YYYY-MM-DD`) trở lên có delta cố định | Chuỗi ngày — tăng ngày theo delta |
| Trường hợp khác | Copy |

**Ví dụ — chuỗi số:**

Fill từ `10`, `20` → kéo qua 3 dòng nữa cho ra `30`, `40`, `50`.

**Ví dụ — copy (nguồn đơn):**

Fill từ một `"0900123456"` duy nhất sẽ copy nguyên giá trị đó. Fill một nguồn không bao giờ tự tăng để bảo vệ các giá trị như số điện thoại hay mã có số 0 đứng đầu.

---

## Chọn nhiều cell

Chọn một vùng ngang của các cell trong một dòng để fill nhiều cột cùng lúc.

### Click + kéo

Click một cell và kéo ngang để chọn nhiều cell trong cùng dòng. Vùng được chọn được highlight. Sau đó kéo fill handle để fill tất cả cột đã chọn xuống dưới.

### Shift + click

Click một cell, rồi Shift-click một cell khác trong cùng dòng để chọn vùng giữa chúng.

### Fill vùng đã chọn

Sau khi chọn vùng, kéo fill handle ở góc dưới bên phải của bất kỳ cell nào đang chọn để fill tất cả cột đã chọn.

---

## Fill bằng bàn phím

| Phím tắt | Thao tác |
|----------|---------|
| `Ctrl+D` | Điền giá trị cell hiện tại xuống dòng bên dưới |
| `Ctrl+R` | Điền giá trị cell hiện tại sang cột bên phải |

---

## Undo fill

Mọi thao tác fill (kéo, Ctrl+D, Ctrl+R) là một bước undo duy nhất. Nhấn `Ctrl+Z` để hoàn tác toàn bộ fill cùng lúc.

---

## Dán từ Excel / Google Sheets

Copy một vùng cell từ Excel hoặc Google Sheets, click vào cell đích trên bên trái trong bảng, rồi nhấn `Ctrl+V`.

Bảng đọc văn bản clipboard phân cách bằng tab và ánh xạ giá trị vào các cột đúng theo thứ tự cột.

### Quy tắc dán

- Dán bắt đầu từ cell đang active và điền sang phải và xuống dưới
- Cột thừa (vượt qua cột cuối của bảng) bị bỏ qua
- Nếu dữ liệu dán có nhiều dòng hơn bảng và `createRow` được cung cấp, dòng mới sẽ được append tự động
- Mỗi cell được dán qua validate trước khi commit — giá trị không hợp lệ bị bỏ qua (cell giữ nguyên giá trị trước)
- Dán là một bước undo duy nhất

### Ví dụ

Copy từ Excel:

```
Sản phẩm A  9.99   100
Sản phẩm B  14.99  50
```

Click vào cell `name` của dòng trống đầu tiên, dán — ba cột được điền đúng.

---

## Chỉ fill cell có thể chỉnh sửa

Thao tác fill chỉ ghi vào cell mà `editable` là `true` (hoặc hàm editable trả về `true` cho dòng đó). Cell readonly trong vùng fill bị bỏ qua lặng lẽ.
