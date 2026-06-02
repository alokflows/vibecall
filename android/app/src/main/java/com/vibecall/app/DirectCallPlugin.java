package com.vibecall.app;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;

@CapacitorPlugin(
    name = "DirectCall",
    permissions = {
        @Permission(alias = "call", strings = { Manifest.permission.CALL_PHONE })
    }
)
public class DirectCallPlugin extends Plugin {

    @PluginMethod
    public void call(PluginCall call) {
        if (getPermissionState("call") != PermissionState.GRANTED) {
            requestPermissionForAlias("call", call, "callPermsCallback");
        } else {
            doCall(call);
        }
    }

    @PermissionCallback
    private void callPermsCallback(PluginCall call) {
        if (getPermissionState("call") == PermissionState.GRANTED) {
            doCall(call);
        } else {
            call.reject("Permission denied by user");
        }
    }

    private void doCall(PluginCall call) {
        String number = call.getString("number");
        if (number == null || number.isEmpty()) {
            call.reject("Must provide a number");
            return;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_CALL);
            intent.setData(Uri.parse("tel:" + number));
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Error launching call", e);
        }
    }
}
