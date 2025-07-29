export interface Phone {
    id: number;
    pkid: string;
    name: string;
    description?: string;
    model: string;
    protocol: string;
    location_name?: string;
    calling_search_space_name?: string;
    subscribe_calling_search_space_name?: string;
    device_pool_name?: string;
    sip_profile_name?: string;
    phone_template_name?: string;
    softkey_template_name?: string;
    common_phone_config_name?: string;
    expansion_modules?: any[];
    hlog?: string;
    dnd_status?: string;
    owner_user_name?: string;
    load_information?: string;
    vendor_config?: any;
    enable_extension_mobility: boolean;
    authentication_url?: string;
    secure_authentication_url?: string;
    ip_address?: string;
    status: string;
    registered_with?: string;
    active_load?: string;
    inactive_load?: string;
    css_full_text?: string;
    ucm_id: number;
    created_at: string;
    updated_at: string;
    ucm?: Ucm;
    lines?: Line[];
}

export interface Ucm {
    id: number;
    name: string;
    hostname: string;
    username: string;
    password: string;
    version?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Line {
    id: number;
    pkid: string;
    pattern: string;
    description?: string;
    route_partition_name?: string;
    calling_search_space_name?: string;
    call_pickup_group_name?: string;
    auto_answer: string;
    secondary_calling_search_space_name?: string;
    recording_media_source?: string;
    ucm_id: number;
    created_at: string;
    updated_at: string;
    pivot?: {
        index: string;
        dirn?: string;
        display?: string;
        display_ascii?: string;
        e164_alt_num?: string;
        external_phone_number_mask?: string;
        max_num_calls: string;
        busy_trigger: string;
        ring_settings?: string;
    };
} 