# Phone Screen Capture Feature

This feature allows users to capture screenshots from Cisco IP phones directly from the PingTone interface.

## Requirements

### Phone Requirements

- Phone must be a Cisco 6xxx, 7xxx, 8xxx, or 9xxx series phone
- Phone must be registered and have a valid IP address
- Phone must have Web Access enabled in its configuration
- Phone must be accessible from the PingTone server

### UCM Requirements

- UCM credentials must be configured in PingTone
- The UCM user must have appropriate permissions to access phone web interfaces

## How It Works

1. **Capture Process**: When a user clicks "Capture Now", the system:
    - Validates the phone supports screen capture
    - Makes an HTTP request to the phone's `/CGI/Screenshot` endpoint
    - Saves the image to `storage/app/public/phone-captures/{phone_id}/`
    - Creates a database record with metadata

2. **Storage**: Images are stored in the public storage disk under:

    ```
    storage/app/public/phone-captures/{phone_id}/capture_YYYY-MM-DD_HH-MM-SS.png
    ```

3. **Database**: Screen capture metadata is stored in the MongoDB `phone_screen_captures` collection with:
    - Phone ID reference (MongoDB ObjectId)
    - Filename and file path
    - File size and MIME type
    - Capture timestamp

## API Endpoints

- `POST /phones/{phone}/capture-screenshot` - Capture a new screenshot
- `DELETE /phone-screen-captures/{screenCapture}` - Delete a screen capture

## Database Design

The screen capture feature uses MongoDB for consistency with the rest of the pingtone application:

- **Collection**: `phone_screen_captures`
- **Phone Reference**: Uses MongoDB ObjectId to reference the phone
- **Relationships**: Standard MongoDB Eloquent relationships between Phone and PhoneScreenCapture models

## Frontend Components

- `PhoneScreenCaptures` - Main component for the screen captures tab
- Integrated into the phone edit page as a new tab

## Error Handling

The system handles various error scenarios:

- Phone not supporting screen capture
- Network connectivity issues
- Authentication failures
- Empty or invalid responses
- Storage write failures

## Security Considerations

- Images are stored in public storage (accessible via web)
- Access is controlled through Laravel's authentication middleware
- File paths are validated to prevent directory traversal
- CSRF protection is enabled for all endpoints

## Troubleshooting

### Common Issues

1. **"Phone does not support screen capture"**
    - Check phone model is Cisco 6xxx, 7xxx, 8xxx, or 9xxx series
    - Verify phone is registered and has IP address
    - Ensure UCM credentials are configured

2. **"Authentication failed"**
    - Verify UCM username/password in PingTone
    - Check UCM user has appropriate permissions

3. **"Screenshot endpoint not found"**
    - Enable Web Access on the phone
    - Check phone firmware version supports web interface

4. **"Network timeout"**
    - Verify phone is accessible from PingTone server
    - Check firewall rules allow HTTP access to phone

### Debugging

Check the Laravel logs for detailed error information:

```bash
tail -f storage/logs/laravel.log
```

## Future Enhancements

- Bulk capture functionality
- Scheduled captures
- Image compression/optimization
- Capture history analytics
- Integration with phone status monitoring
