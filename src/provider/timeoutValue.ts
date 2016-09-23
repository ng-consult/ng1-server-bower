export default class TimeoutValueProvider {

    private timeoutValue: number;

    constructor(){
        this.timeoutValue = 200;
    }

    setTimeoutValue = (value: number) => {
        this.timeoutValue = value;
    };

    $get = () => {
        return {
            set: (value: number): void => {
                this.setTimeoutValue(value);
            },
            get: (): number => {
                return this.timeoutValue;
            }
        }
    }
}