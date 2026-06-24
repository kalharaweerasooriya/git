package com.smartinventory.dto;

public class StockRequest {
    private Integer changeQty;   // +in / -out / adjust delta
    private String type;         // IN, OUT, ADJUST
    private String reason;

    public Integer getChangeQty() { return changeQty; }
    public void setChangeQty(Integer changeQty) { this.changeQty = changeQty; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
