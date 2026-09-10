import * as crypto from 'crypto';

interface CreateOrderOptions {
  amount: number; // in Rupees
  bookingId: string;
}

interface PaymentOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  provider: 'RAZORPAY' | 'SIMULATOR';
  keyId?: string;
}

interface VerificationOptions {
  orderId: string;
  paymentId: string;
  signature?: string;
}

export class PaymentService {
  /**
   * Create a payment order. If Razorpay keys are configured, use Razorpay.
   * Otherwise, return a simulated order payload.
   */
  static async createOrder(options: CreateOrderOptions): Promise<PaymentOrderResult> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const amountInPaise = Math.round(options.amount * 100);

    if (keyId && keySecret) {
      try {
        // Dynamic import to prevent failing if razorpay is not installed
        // We'll require it locally
        const Razorpay = require('razorpay');
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const order = await instance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_${options.bookingId.substring(0, 10)}`,
        });

        return {
          orderId: order.id,
          amount: options.amount,
          currency: 'INR',
          provider: 'RAZORPAY',
          keyId: keyId,
        };
      } catch (err) {
        console.error('Failed to create order on Razorpay, falling back to simulator:', err);
      }
    }

    // Default Simulator Mode
    const simulatedOrderId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
    return {
      orderId: simulatedOrderId,
      amount: options.amount,
      currency: 'INR',
      provider: 'SIMULATOR',
    };
  }

  /**
   * Verify a payment signature. If Razorpay keys are configured, verify cryptographically.
   * Otherwise, verify the simulator's signature structure.
   */
  static verifyPayment(options: VerificationOptions): boolean {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret && options.signature) {
      try {
        const body = options.orderId + '|' + options.paymentId;
        const expectedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(body.toString())
          .digest('hex');

        return expectedSignature === options.signature;
      } catch (err) {
        console.error('Error verifying Razorpay signature:', err);
        return false;
      }
    }

    // Simulator verification check
    // In simulator mode, the checkout panel generates a paymentId starting with "pay_sim_"
    // and sends it to the server. We verify it matches the simulated format.
    if (options.orderId.startsWith('order_sim_') && options.paymentId.startsWith('pay_sim_')) {
      return true;
    }

    return false;
  }
}
