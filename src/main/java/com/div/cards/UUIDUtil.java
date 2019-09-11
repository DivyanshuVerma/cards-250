package com.div.cards;

import javax.inject.Named;
import java.nio.ByteBuffer;
import java.util.Base64;
import java.util.UUID;

@Named
public class UUIDUtil {

    public String base64() {
        UUID uuid = UUID.randomUUID();
        ByteBuffer bb = ByteBuffer.wrap(new byte[16]);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bb.array());
    }

}
